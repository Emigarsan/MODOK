package com.example.counter.controller;

import com.example.counter.service.snapshot.SnapshotService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/backup")
@CrossOrigin(origins = "*")
public class BackupAdminController {

    private final SnapshotService snapshotService;
    private final String adminSecret;

    public BackupAdminController(SnapshotService snapshotService,
                                 @Value("${admin.secret:}") String adminSecret) {
        this.snapshotService = snapshotService;
        this.adminSecret = adminSecret;
    }

    private boolean isAdmin(String secret) {
        return adminSecret != null && !adminSecret.isEmpty() && adminSecret.equals(secret);
    }

    @GetMapping("/list")
    public ResponseEntity<?> list(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) throws IOException {
        if (!isAdmin(secret)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Path dir = snapshotService.getBackupDirPath();
        if (dir == null || !Files.exists(dir)) {
            return ResponseEntity.ok(Map.of("dir", dir == null ? "" : dir.toString(), "files", List.of()));
        }
        List<Map<String, Object>> files;
        try (var s = Files.list(dir)) {
            files = s.filter(p -> {
                        String n = p.getFileName().toString();
                        return n.startsWith("app-") && n.endsWith(".json");
                    })
                    .sorted(Comparator.comparingLong(this::mtimeSafe).reversed())
                    .map(p -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("name", p.getFileName().toString());
                        m.put("size", Long.valueOf(sizeSafe(p)));
                        m.put("modified", Long.valueOf(mtimeSafe(p)));
                        return m;
                    })
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(Map.of("dir", dir.toString(), "files", files));
    }

    @PostMapping("/snapshot-now")
    public ResponseEntity<?> snapshotNow(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAdmin(secret)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            Path p = snapshotService.createSnapshotNow();
            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "path", p == null ? "" : p.toString(),
                    "name", p == null ? "" : p.getFileName().toString(),
                    "modified", p == null ? 0L : mtimeSafe(p),
                    "size", p == null ? 0L : sizeSafe(p)
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("ok", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/download/{name}")
    public ResponseEntity<byte[]> download(@PathVariable("name") String name,
                                           @RequestHeader(value = "X-Admin-Secret", required = false) String secret) throws IOException {
        if (!isAdmin(secret)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        if (name == null || !name.startsWith("app-") || !name.endsWith(".json")) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        Path dir = snapshotService.getBackupDirPath();
        if (dir == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        Path file = dir.resolve(name).normalize();
        if (!file.startsWith(dir.normalize()) || !Files.exists(file)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        byte[] data = Files.readAllBytes(file);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDisposition(ContentDisposition.attachment().filename(name).build());
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{name}")
    public ResponseEntity<?> deleteOne(@PathVariable("name") String name,
                                       @RequestHeader(value = "X-Admin-Secret", required = false) String secret) throws IOException {
        if (!isAdmin(secret)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (name == null || !name.startsWith("app-") || !name.endsWith(".json")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("ok", false, "error", "Nombre inválido"));
        }
        Path dir = snapshotService.getBackupDirPath();
        if (dir == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));
        Path file = dir.resolve(name).normalize();
        if (!file.startsWith(dir.normalize()) || !Files.exists(file)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));
        }
        try {
            Files.deleteIfExists(file);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("ok", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/purge-older-than")
    public ResponseEntity<?> purgeOlderThan(@RequestParam("minutes") long minutes,
                                            @RequestHeader(value = "X-Admin-Secret", required = false) String secret) throws IOException {
        if (!isAdmin(secret)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (minutes < 0) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("ok", false, "error", "minutes >= 0"));
        Path dir = snapshotService.getBackupDirPath();
        if (dir == null || !Files.exists(dir)) return ResponseEntity.ok(Map.of("ok", true, "deleted", 0));
        long cutoff = System.currentTimeMillis() - (minutes * 60L * 1000L);
        int deleted = 0;
        try (var s = Files.list(dir)) {
            for (Path p : s.filter(p -> {
                String n = p.getFileName().toString();
                return n.startsWith("app-") && n.endsWith(".json");
            }).collect(Collectors.toList())) {
                if (mtimeSafe(p) < cutoff) {
                    try { Files.deleteIfExists(p); deleted++; } catch (IOException ignored) {}
                }
            }
        }
        return ResponseEntity.ok(Map.of("ok", true, "deleted", deleted));
    }

    @PostMapping("/purge-keep-latest")
    public ResponseEntity<?> purgeKeepLatest(@RequestParam("keep") int keep,
                                             @RequestHeader(value = "X-Admin-Secret", required = false) String secret) throws IOException {
        if (!isAdmin(secret)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (keep < 0) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("ok", false, "error", "keep >= 0"));
        Path dir = snapshotService.getBackupDirPath();
        if (dir == null || !Files.exists(dir)) return ResponseEntity.ok(Map.of("ok", true, "deleted", 0));
        List<Path> files;
        try (var s = Files.list(dir)) {
            files = s.filter(p -> {
                        String n = p.getFileName().toString();
                        return n.startsWith("app-") && n.endsWith(".json");
                    })
                    .sorted(Comparator.comparingLong(this::mtimeSafe).reversed())
                    .collect(Collectors.toList());
        }
        int deleted = 0;
        for (int i = keep; i < files.size(); i++) {
            try { Files.deleteIfExists(files.get(i)); deleted++; } catch (IOException ignored) {}
        }
        return ResponseEntity.ok(Map.of("ok", true, "deleted", deleted));
    }

    private long mtimeSafe(Path p) {
        try {
            return Files.getLastModifiedTime(p).toMillis();
        } catch (IOException e) { return 0L; }
    }

    private long sizeSafe(Path p) {
        try {
            return Files.size(p);
        } catch (IOException e) { return 0L; }
    }
}

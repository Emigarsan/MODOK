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
                        String name = p.getFileName().toString();
                        return name.startsWith("app-") && name.endsWith(".json");
                    })
                    .sorted(Comparator.comparingLong(this::mtimeSafe).reversed())
                    .map(p -> Map.of(
                            "name", p.getFileName().toString(),
                            "size", sizeSafe(p),
                            "modified", mtimeSafe(p)
                    ))
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


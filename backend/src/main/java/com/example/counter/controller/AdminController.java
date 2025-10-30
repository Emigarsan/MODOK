package com.example.counter.controller;

import com.example.counter.service.TablesService;
import com.example.counter.service.model.FreeGameTable;
import com.example.counter.service.model.RegisterTable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    private final TablesService tablesService;
    private final String adminSecret;

    public AdminController(TablesService tablesService,
                           @Value("${admin.secret:}") String adminSecret) {
        this.tablesService = tablesService;
        this.adminSecret = adminSecret;
    }

    private boolean isAdmin(String secret) {
        return adminSecret != null && !adminSecret.isEmpty() && adminSecret.equals(secret);
    }

    @GetMapping("/tables")
    public ResponseEntity<?> listTables(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAdmin(secret)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(Map.of(
                "register", tablesService.listRegister(),
                "freegame", tablesService.listFreeGame()
        ));
    }

    @GetMapping(value = "/export/event.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportEventCsv(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAdmin(secret)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        List<RegisterTable> reg = tablesService.listRegister();
        String csv = buildRegisterCsv(reg);
        return csvResponse(csv, "event.csv");
    }

    @GetMapping(value = "/export/freegame.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportFreeGameCsv(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAdmin(secret)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        List<FreeGameTable> free = tablesService.listFreeGame();
        String csv = buildFreeGameCsv(free);
        return csvResponse(csv, "freegame.csv");
    }

    private String buildRegisterCsv(List<RegisterTable> reg) {
        StringJoiner sj = new StringJoiner("\n");
        sj.add("id,name,code,createdAt");
        DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT;
        for (RegisterTable t : reg) {
            sj.add(String.join(",",
                    escape(t.id()),
                    escape(t.name()),
                    escape(t.code()),
                    escape(fmt.format(t.createdAt()))
            ));
        }
        return sj.toString() + "\n";
    }

    private String buildFreeGameCsv(List<FreeGameTable> free) {
        StringJoiner sj = new StringJoiner("\n");
        sj.add("id,name,players,notes,code,createdAt");
        DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT;
        for (FreeGameTable t : free) {
            sj.add(String.join(",",
                    escape(t.id()),
                    escape(t.name()),
                    String.valueOf(t.players()),
                    escape(t.notes()),
                    escape(t.code()),
                    escape(fmt.format(t.createdAt()))
            ));
        }
        return sj.toString() + "\n";
    }

    private String escape(String v) {
        if (v == null) return "";
        boolean needsQuote = v.contains(",") || v.contains("\n") || v.contains("\"");
        String out = v.replace("\"", "\"\"");
        return needsQuote ? ("\"" + out + "\"") : out;
    }

    private ResponseEntity<byte[]> csvResponse(String csv, String filename) {
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("text/csv"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\""+filename+"\"");
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }
}

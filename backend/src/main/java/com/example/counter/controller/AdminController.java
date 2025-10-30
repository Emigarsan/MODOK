package com.example.counter.controller;

import com.example.counter.service.CounterService;
import com.example.counter.service.TablesService;
import com.example.counter.service.model.CounterState;
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
    private final CounterService counterService;
    private final String adminSecret;

    public AdminController(TablesService tablesService, CounterService counterService,
                           @Value("${admin.secret:}") String adminSecret) {
        this.tablesService = tablesService;
        this.counterService = counterService;
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

    @GetMapping(value = "/export/tables.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportTablesCsv(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAdmin(secret)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        List<RegisterTable> reg = tablesService.listRegister();
        List<FreeGameTable> free = tablesService.listFreeGame();
        String csv = buildTablesCsv(reg, free);
        return csvResponse(csv, "tables.csv");
    }

    @GetMapping(value = "/export/counters.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportCountersCsv(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAdmin(secret)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        CounterState s = counterService.getState();
        String header = "primary,secondary,tertiary,secondaryImageIndex\n";
        String row = s.primary()+","+s.secondary()+","+s.tertiary()+","+s.secondaryImageIndex()+"\n";
        return csvResponse(header + row, "counters.csv");
    }

    private String buildTablesCsv(List<RegisterTable> reg, List<FreeGameTable> free) {
        StringJoiner sj = new StringJoiner("\n");
        sj.add("type,id,name,players,notes,code,createdAt");
        DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT;
        for (RegisterTable t : reg) {
            sj.add(String.join(",",
                    "register",
                    escape(t.id()),
                    escape(t.name()),
                    "",
                    "",
                    escape(t.code()),
                    escape(fmt.format(t.createdAt()))
            ));
        }
        for (FreeGameTable t : free) {
            sj.add(String.join(",",
                    "freegame",
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

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
        // One row per player; repeat table info
        sj.add("id,tableNumber,tableName,difficulty,players,code,createdAt,playerIndex,character,aspect");
        DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT;
        for (RegisterTable t : reg) {
            List<com.example.counter.service.model.PlayerInfo> list = t.playersInfo();
            if (list == null || list.isEmpty()) {
                sj.add(String.join(",",
                        escape(t.id()),
                        String.valueOf(t.tableNumber()),
                        escape(t.tableName()),
                        escape(t.difficulty()),
                        String.valueOf(t.players()),
                        escape(t.code()),
                        escape(fmt.format(t.createdAt())),
                        "",
                        "",
                        ""
                ));
                continue;
            }
            for (int i = 0; i < list.size(); i++) {
                var pi = list.get(i);
                sj.add(String.join(",",
                        escape(t.id()),
                        String.valueOf(t.tableNumber()),
                        escape(t.tableName()),
                        escape(t.difficulty()),
                        String.valueOf(t.players()),
                        escape(t.code()),
                        escape(fmt.format(t.createdAt())),
                        String.valueOf(i + 1),
                        escape(pi.character()),
                        escape(pi.aspect())
                ));
            }
        }
        return sj.toString() + "\n";
    }

    private String buildFreeGameCsv(List<FreeGameTable> free) {
        StringJoiner sj = new StringJoiner("\n");
        // One row per player; repeat table info
        sj.add("id,tableNumber,name,players,code,createdAt,playerIndex,character,aspect,legacy");
        DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT;
        for (FreeGameTable t : free) {
            var list = t.playersInfo();
            if (list == null || list.isEmpty()) {
                sj.add(String.join(",",
                        escape(t.id()),
                        String.valueOf(t.tableNumber()),
                        escape(t.name()),
                        String.valueOf(t.players()),
                        escape(t.code()),
                        escape(fmt.format(t.createdAt())),
                        "",
                        "",
                        "",
                        ""
                ));
                continue;
            }
            for (int i = 0; i < list.size(); i++) {
                var pi = list.get(i);
                sj.add(String.join(",",
                        escape(t.id()),
                        String.valueOf(t.tableNumber()),
                        escape(t.name()),
                        String.valueOf(t.players()),
                        escape(t.code()),
                        escape(fmt.format(t.createdAt())),
                        String.valueOf(i + 1),
                        escape(pi.character()),
                        escape(pi.aspect()),
                        escape(pi.legacy())
                ));
            }
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

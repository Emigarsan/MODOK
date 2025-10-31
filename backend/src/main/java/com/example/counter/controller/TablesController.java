package com.example.counter.controller;

import com.example.counter.service.TablesService;
import com.example.counter.service.model.FreeGameTable;
import com.example.counter.service.model.RegisterTable;
import com.example.counter.service.model.PlayerInfo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "*")
public class TablesController {
    private final TablesService tablesService;

    public TablesController(TablesService tablesService) {
        this.tablesService = tablesService;
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/register/create")
    public ResponseEntity<RegisterTable> createRegister(@RequestBody Map<String, Object> payload) {
        int tableNumber = ((Number) payload.getOrDefault("tableNumber", 0)).intValue();
        String tableName = (String) payload.getOrDefault("tableName", "");
        String difficulty = (String) payload.getOrDefault("difficulty", "");
        int players = ((Number) payload.getOrDefault("players", 0)).intValue();
        List<Map<String, Object>> p = (List<Map<String, Object>>) payload.getOrDefault("playersInfo", List.of());
        List<PlayerInfo> info = new ArrayList<>();
        for (Map<String, Object> row : p) {
            String character = String.valueOf(row.getOrDefault("character", ""));
            String aspect = String.valueOf(row.getOrDefault("aspect", ""));
            info.add(new PlayerInfo(character, aspect));
        }
        if (tablesService.isTableNumberUsed(tableNumber)) {
            return ResponseEntity.status(409).build();
        }
        return ResponseEntity.ok(tablesService.createRegister(tableNumber, tableName, difficulty, players, info));
    }

    @PostMapping("/register/join")
    public ResponseEntity<Map<String, Object>> joinRegister(@RequestBody Map<String, Object> payload) {
        String code = String.valueOf(payload.getOrDefault("code", ""));
        boolean ok = tablesService.joinRegister(code);
        return ResponseEntity.ok(Map.of("ok", ok));
    }

    @GetMapping("/register/list")
    public ResponseEntity<List<RegisterTable>> listRegister() {
        return ResponseEntity.ok(tablesService.listRegister());
    }

    @GetMapping("/register/characters")
    public ResponseEntity<List<String>> listRegisterCharacters() {
        return ResponseEntity.ok(tablesService.getRegisterCharacters());
    }

    @GetMapping("/register/aspects")
    public ResponseEntity<List<String>> listRegisterAspects() {
        return ResponseEntity.ok(tablesService.getRegisterAspects());
    }

    @GetMapping("/register/spiderwoman-aspects")
    public ResponseEntity<List<String>> listRegisterSpiderwomanAspects() {
        return ResponseEntity.ok(tablesService.getRegisterSpiderwomanAspects());
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/freegame/create")
    public ResponseEntity<com.example.counter.service.model.FreeGameTable> createFreeGame(@RequestBody Map<String, Object> payload) {
        int tableNumber = ((Number) payload.getOrDefault("tableNumber", 0)).intValue();
        String name = String.valueOf(payload.getOrDefault("name", "Mesa Libre"));
        int players = ((Number) payload.getOrDefault("players", 0)).intValue();
        List<Map<String, Object>> p = (List<Map<String, Object>>) payload.getOrDefault("playersInfo", List.of());
        List<com.example.counter.service.model.FreeGamePlayerInfo> info = new ArrayList<>();
        for (Map<String, Object> row : p) {
            String character = String.valueOf(row.getOrDefault("character", ""));
            String aspect = String.valueOf(row.getOrDefault("aspect", ""));
            String legacy = String.valueOf(row.getOrDefault("legacy", "Ninguno"));
            info.add(new com.example.counter.service.model.FreeGamePlayerInfo(character, aspect, legacy));
        }
        if (tablesService.isTableNumberUsed(tableNumber)) {
            return ResponseEntity.status(409).build();
        }
        return ResponseEntity.ok(tablesService.createFreeGame(tableNumber, name, players, info));
    }

    @PostMapping("/freegame/join")
    public ResponseEntity<Map<String, Object>> joinFreeGame(@RequestBody Map<String, Object> payload) {
        String code = String.valueOf(payload.getOrDefault("code", ""));
        boolean ok = tablesService.joinFreeGame(code);
        return ResponseEntity.ok(Map.of("ok", ok));
    }
}

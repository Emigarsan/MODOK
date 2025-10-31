package com.example.counter.service;

import com.example.counter.service.model.FreeGameTable;
import com.example.counter.service.model.PlayerInfo;
import com.example.counter.service.model.RegisterTable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class TablesService {
    private final List<RegisterTable> registerTables = new ArrayList<>();
    private final List<FreeGameTable> freeGameTables = new ArrayList<>();
    private final List<String> registerCharacters;
    private final List<String> registerAspects;
    private final List<String> registerSpiderwomanAspects;

    public TablesService() {
        registerCharacters = List.of(
                "Spiderman (Peter Parker)",
                "Capitana Marvel",
                "Hulka",
                "Iron Man",
                "Pantera Negra",
                "Capitán América",
                "Ms. Marvel",
                "Thor",
                "Viuda Negra",
                "Dr. Extraño",
                "Hulk",
                "Ojo de Halcón",
                "Spider-woman",
                "Hombre Hormiga",
                "Avispa",
                "Mercurio",
                "Bruja Escarlata",
                "Groot",
                "Mapache Cohete",
                "Star-Lord",
                "Gamora",
                "Drax",
                "Veneno",
                "Spectrum",
                "Adam Warlock",
                "Nebula",
                "Máquina de Guerra",
                "Valquiria",
                "Vision",
                "Ghost-Spider",
                "Spider-Man (Miles Morales)",
                "Nova",
                "Ironheart",
                "Spidercerdo",
                "SP//dr",
                "Coloso",
                "Gatasombra",
                "Cíclope",
                "Fénix",
                "Lobezno",
                "Tormenta",
                "Gambito",
                "Pícara",
                "Cable",
                "Dominó",
                "Mariposa Mental",
                "Ángel",
                "X-23",
                "Masacre",
                "Bishop",
                "Magik",
                "Hombre de Hielo",
                "Júbilo",
                "Rondador Nocturno",
                "Magneto",
                "María Hill",
                "Nick Fury",
                "Black Panther",
                "Seda",
                "Halcón",
                "Soldado de invierno"
        );
        registerAspects = List.of(
                "Agresividad",
                "Justicia",
                "Liderazgo",
                "Protección",
                "Masacrismo"
        );
        registerSpiderwomanAspects = List.of(
                "Agresividad-Justicia",
                "Agresividad-Liderazgo",
                "Agresividad-Masacrismo",
                "Agresividad-Protección",
                "Justicia-Liderazgo",
                "Justicia-Masacrismo",
                "Justicia-Protección",
                "Liderazgo-Masacrismo",
                "Liderazgo-Protección",
                "Masacrismo-Protección"
        );
    }

    public synchronized RegisterTable createRegister(int tableNumber, String tableName, String difficulty, int players, List<PlayerInfo> playersInfo) {
        String id = UUID.randomUUID().toString();
        String code = shortCode();
        if (playersInfo == null) playersInfo = List.of();
        List<PlayerInfo> sanitized = sanitizeRegisterPlayers(playersInfo);
        int tn = Math.max(0, tableNumber);
        RegisterTable t = new RegisterTable(id, tn, tableName, difficulty, Math.max(0, players), sanitized, code, Instant.now());
        registerTables.add(t);
        return t;
    }

    public synchronized boolean joinRegister(String code) {
        return registerTables.stream().anyMatch(t -> t.code().equalsIgnoreCase(code));
    }

    public synchronized com.example.counter.service.model.FreeGameTable createFreeGame(int tableNumber, String name, int players, List<com.example.counter.service.model.FreeGamePlayerInfo> playersInfo) {
        String id = UUID.randomUUID().toString();
        String code = shortCode();
        int tn = Math.max(0, tableNumber);
        List<com.example.counter.service.model.FreeGamePlayerInfo> info = playersInfo == null ? List.of() : new ArrayList<>(playersInfo);
        com.example.counter.service.model.FreeGameTable t = new com.example.counter.service.model.FreeGameTable(id, tn, name, Math.max(0, players), info, code, Instant.now());
        freeGameTables.add(t);
        return t;
    }

    public synchronized boolean joinFreeGame(String code) {
        return freeGameTables.stream().anyMatch(t -> t.code().equalsIgnoreCase(code));
    }

    public synchronized List<RegisterTable> listRegister() {
        return Collections.unmodifiableList(new ArrayList<>(registerTables));
    }

    public synchronized List<FreeGameTable> listFreeGame() {
        return Collections.unmodifiableList(new ArrayList<>(freeGameTables));
    }

    public synchronized boolean isTableNumberUsed(int tableNumber) {
        int tn = Math.max(0, tableNumber);
        boolean inRegister = registerTables.stream().anyMatch(t -> t.tableNumber() == tn);
        boolean inFree = freeGameTables.stream().anyMatch(t -> t.tableNumber() == tn);
        return inRegister || inFree;
    }

    public synchronized List<String> getRegisterCharacters() {
        return Collections.unmodifiableList(new ArrayList<>(registerCharacters));
    }

    public synchronized List<String> getRegisterAspects() {
        return Collections.unmodifiableList(new ArrayList<>(registerAspects));
    }

    public synchronized List<String> getRegisterSpiderwomanAspects() {
        return Collections.unmodifiableList(new ArrayList<>(registerSpiderwomanAspects));
    }

    private List<PlayerInfo> sanitizeRegisterPlayers(List<PlayerInfo> playersInfo) {
        List<PlayerInfo> out = new ArrayList<>();
        for (PlayerInfo pi : playersInfo) {
            String character = safeTrim(pi == null ? null : pi.character());
            String aspect = safeTrim(pi == null ? null : pi.aspect());

            if (character == null) character = "";
            if (aspect == null) aspect = "";

            if (equalsIgnoreCase(character, "Adam Warlock")) {
                // Adam Warlock: aspecto vacío y bloqueado
                aspect = "";
            } else if (equalsIgnoreCase(character, "Spider-woman")) {
                // Spider-woman: debe estar en la lista combinada, si no, limpiar
                if (!containsIgnoreCase(registerSpiderwomanAspects, aspect)) {
                    aspect = "";
                }
            } else {
                // Otros: deben usar aspectos base simples
                if (!containsIgnoreCase(registerAspects, aspect)) {
                    aspect = "";
                }
            }
            out.add(new PlayerInfo(character, aspect));
        }
        return out;
    }

    private String safeTrim(String s) {
        return s == null ? null : s.trim();
    }

    private boolean equalsIgnoreCase(String a, String b) {
        return a == null ? b == null : b != null && a.equalsIgnoreCase(b);
    }

    private boolean containsIgnoreCase(List<String> list, String value) {
        if (value == null) return false;
        for (String item : list) {
            if (item != null && item.equalsIgnoreCase(value)) return true;
        }
        return false;
    }

    private String shortCode() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}

package com.example.counter.controller;

import com.example.counter.service.CounterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/counter")
@CrossOrigin(origins = "*")
public class CounterController {

    private final CounterService counterService;

    public CounterController(CounterService counterService) {
        this.counterService = counterService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Integer>> getCurrentValue() {
        return ResponseEntity.ok(Map.of("value", counterService.getCurrentValue()));
    }

    @PostMapping("/increment")
    public ResponseEntity<Map<String, Integer>> increment(@RequestBody Map<String, Integer> payload) {
        int amount = payload.getOrDefault("amount", 1);
        return ResponseEntity.ok(Map.of("value", counterService.increment(amount)));
    }

    @PostMapping("/decrement")
    public ResponseEntity<Map<String, Integer>> decrement(@RequestBody Map<String, Integer> payload) {
        int amount = payload.getOrDefault("amount", 1);
        return ResponseEntity.ok(Map.of("value", counterService.decrement(amount)));
    }
}

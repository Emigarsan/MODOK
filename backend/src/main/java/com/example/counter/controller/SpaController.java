package com.example.counter.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {
    // Forward single-segment non-API, non-file paths to index.html (React SPA)
    // Works for routes like /register, /freegame, /event, /display, /admin
    @RequestMapping("/{path:^(?!api$)[^\\.]*$}")
    public String forward() {
        return "forward:/index.html";
    }
}

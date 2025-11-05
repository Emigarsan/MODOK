package com.example.counter.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {
    // Forward non-API paths (single or nested) without file extensions to index.html (React SPA)
    @RequestMapping(value = {
            "/{path:^(?!api$)[^\\.]*$}",
            "/{path:^(?!api$)[^\\.]*$}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}

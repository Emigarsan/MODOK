package com.example.counter.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {
    // Forward all non-API, non-static, non-file requests to index.html for SPA routes
    @RequestMapping({
            "/{path:^(?!api|static|assets|favicon\\.ico|index\\.html).*$}",
            "/**/{path:^(?!api|static|assets).*$}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}


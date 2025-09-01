package com.example.gatway.Security;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class jwtFilter implements WebFilter {

    private final JwtUtil jwtUtil;

    public jwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private static final String[] PUBLIC_URLS = {
        "/ms-auth/api/user/profile" , "/ms-auth/api/register" ,
         "/ms-auth/api/login" , "/ms-auth/api/logout" ,   "/ms-auth/api/refresh-token",
          "/ms-auth/api/auth/google" , "/ms-auth/api/auth/facebook" ,
    };

    private static final String[] CLIENT_URLS = {"/ms-products/api/products" };
    private static final String[] SELLER_URLS = {"ms-products/api/product"};

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        String method = request.getMethod().name();

        for (String pub : PUBLIC_URLS) {
            if (path.startsWith(pub)) {
                System.out.println("Public endpoint accessed: {}" + path);
                return chain.filter(exchange);
            }
        };

        // Extract Authorization header
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        if(!jwtUtil.isValid(token)) {
            return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
        String role = jwtUtil.getRole(token);

        // Enforce role-based access
        for (String clientPrefix : CLIENT_URLS) {
            if (path.startsWith(clientPrefix) && !("client".equals(role) || "admin".equals(role))) {
                return onError(exchange, "Access denied: client role required", HttpStatus.FORBIDDEN);
            }
        }
        for (String sellerPrefix : SELLER_URLS) {
            if (path.startsWith(sellerPrefix) && !("seller".equals(role) || "admin".equals(role))) {
                return onError(exchange, "Access denied: seller role required", HttpStatus.FORBIDDEN);
            }
        }

        if (path.matches("/ms-products/api/product/[a-fA-F0-9\\-]+")) {
            switch (method.toUpperCase()) {
                case "GET":
                    if (!role.equals("client") && !role.equals("admin")) {
                        return onError(exchange, "Access denied: client role required", HttpStatus.FORBIDDEN);
                    }
                    break;
                case "PATCH":
                case "DELETE":
                    if (!role.equals("seller") && !role.equals("admin")) {
                        return onError(exchange, "Access denied: seller role required", HttpStatus.FORBIDDEN);
                    }
                    break;
                default:
                    return onError(exchange, "Method not allowed", HttpStatus.METHOD_NOT_ALLOWED);
            }
        }

        return chain.filter(exchange);

    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }


}

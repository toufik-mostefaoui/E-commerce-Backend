package com.example.gatway.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class JwtUtil {
    //private final String SECRET = "b67e28f680af66b2ae4958f1f971fe6d6a099b2a80dd6f314b5a30d0a1a5faca44553bb5e61baa1580eefcc9f8f02841275018fd488f1f827af3c03f57b63ca0";


    @Value("${jwt.secret}")
    private String secret;
    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token){
        try{
            extractClaims(token);
            return true;
        }catch (Exception e){
            return false;
        }
    }

    public String getRole(String token){
        return extractClaims(token).get("role" , String.class);
    }
}

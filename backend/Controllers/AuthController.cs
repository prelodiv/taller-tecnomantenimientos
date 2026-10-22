using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TallerApi.Data;
using TallerApi.Models;

namespace TallerApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(TallerDbContext db) : ControllerBase
{
    public record LoginRequest(
        [Required, MaxLength(100)] string Username,
        [Required, MaxLength(256)] string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        Response.Headers.CacheControl = "no-store";
        var username = request.Username.Trim().ToLowerInvariant();
        var user = await db.Usuarios.SingleOrDefaultAsync(u => u.Username == username);
        var hasher = new PasswordHasher<Usuario>();
        if (user is null || hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password)
            == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Usuario o clave incorrectos." });

        var identity = new ClaimsIdentity(new[] {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        }, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity), new AuthenticationProperties { IsPersistent = false });
        return Ok(new { username = user.Username, role = user.Role });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new { username = User.Identity!.Name, role = User.FindFirstValue(ClaimTypes.Role) });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { ok = true });
    }
}

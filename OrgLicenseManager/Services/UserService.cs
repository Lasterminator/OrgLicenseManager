using OrgLicenseManager.Data;
using OrgLicenseManager.Entities;
using Microsoft.EntityFrameworkCore;

namespace OrgLicenseManager.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User> GetOrCreateAsync(string externalId, string email, string role)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.ExternalId == externalId);

        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                ExternalId = externalId,
                Email = email,
                Role = role,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (user.Email != email || user.Role != role)
        {
            user.Email = email;
            user.Role = role;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return user;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetByExternalIdAsync(string externalId)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.ExternalId == externalId);
    }
}

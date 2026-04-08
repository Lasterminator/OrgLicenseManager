using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using OrgLicenseManager.Data;

namespace OrgLicenseManager.Tests;

internal static class TestDbFactory
{
    public static SqliteConnection CreateConnection()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        return connection;
    }

    public static ApplicationDbContext CreateContext(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}

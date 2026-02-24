using OrgLicenseManager.BackgroundServices;
using OrgLicenseManager.Extensions;
using OrgLicenseManager.Services;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", Serilog.Events.LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/orglicensemanager-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Starting OrgLicenseManager API");

    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    builder.Services.AddDatabase(builder.Configuration);
    builder.Services.AddExceptionHandling();
    builder.Services.AddSwaggerDocumentation();
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddControllers();

    builder.Services.AddHttpContextAccessor();

    builder.Services.AddSingleton<ILicenseSettingsService, LicenseSettingsService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<IEmailService, MockEmailService>();
    builder.Services.AddScoped<ILicenseService, LicenseService>();
    builder.Services.AddScoped<IOrganizationService, OrganizationService>();
    builder.Services.AddScoped<IInvitationService, InvitationService>();
    builder.Services.AddScoped<IMembershipService, MembershipService>();

    builder.Services.AddHostedService<LicenseRenewalService>();

    var app = builder.Build();

    app.UseExceptionHandling();
    app.UseSerilogRequestLogging();
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseSwaggerDocumentation();

    app.MapControllers();

    // Initialize license settings from database
    var licenseSettings = app.Services.GetRequiredService<ILicenseSettingsService>();
    await licenseSettings.InitializeAsync();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

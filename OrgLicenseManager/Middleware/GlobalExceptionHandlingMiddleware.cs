using System.Text.Json;
using OrgLicenseManager.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace OrgLicenseManager.Middleware;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        ProblemDetails problemDetails;

        if (exception is CustomException customException)
        {
            // Log at appropriate level based on status code
            if (customException.StatusCode >= 500)
            {
                _logger.LogError(exception, "Server error: {Message}", customException.Message);
            }
            else if (customException.StatusCode >= 400)
            {
                _logger.LogWarning("Client error: {StatusCode} - {Message} - Path: {Path}",
                    customException.StatusCode, customException.Message, context.Request.Path);
            }

            problemDetails = new ProblemDetails
            {
                Status = customException.StatusCode,
                Title = GetTitleFromStatusCode(customException.StatusCode),
                Detail = customException.Detail ?? customException.Message,
                Instance = context.Request.Path
            };

            context.Response.StatusCode = customException.StatusCode;
        }
        else
        {
            _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

            problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An error occurred while processing your request",
                Detail = "An unexpected error occurred. Please try again later.",
                Instance = context.Request.Path
            };

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        }

        context.Response.ContentType = "application/problem+json";

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(problemDetails, options);
        await context.Response.WriteAsync(json);
    }

    private static string GetTitleFromStatusCode(int statusCode)
    {
        return statusCode switch
        {
            StatusCodes.Status400BadRequest => "Bad Request",
            StatusCodes.Status401Unauthorized => "Unauthorized",
            StatusCodes.Status403Forbidden => "Forbidden",
            StatusCodes.Status404NotFound => "Not Found",
            StatusCodes.Status409Conflict => "Conflict",
            _ => "An error occurred"
        };
    }
}

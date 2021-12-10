using System.Threading.Tasks;

using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using Serilog;

var log = new LoggerConfiguration()
	.MinimumLevel.Verbose()
	.WriteTo.Console()
	.WriteTo.File("logs/logs.log", rollingInterval: RollingInterval.Day)
	.CreateLogger();

Log.Logger = log;

var configBuilder = new ConfigurationBuilder()
	.AddJsonFile("config.json")
	.Build();

var settings = configBuilder.GetRequiredSection("Settings").Get<Settings>();

var config = new DiscordSocketConfig
{
	LogLevel = LogSeverity.Verbose,
};

var client = new DiscordSocketClient(config);

client.Log += Logging.Log;

await client.LoginAsync(TokenType.Bot, settings.Token);
await client.StartAsync();
await Task.Delay(-1);

public class Settings
{
	public string Token { get; set; }
}

public static class Logging
{
	public static Task Log(LogMessage message)
	{
		switch (message.Severity)
		{
			case LogSeverity.Verbose:
				Serilog.Log.Logger.Verbose(message.Message);
				break;
			case LogSeverity.Debug:
				Serilog.Log.Logger.Debug(message.Message);
				break;
			case LogSeverity.Info:
				Serilog.Log.Logger.Information(message.Message);
				break;
			case LogSeverity.Warning:
				Serilog.Log.Logger.Warning(message.Message);
				break;
			case LogSeverity.Error:
				Serilog.Log.Logger.Error(message.Message);
				break;
		}

		return Task.CompletedTask;
	}
}

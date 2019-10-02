using eShopDashboard.Infrastructure.Data.Catalog;
using eShopDashboard.Infrastructure.Data.Ordering;
using eShopDashboard.Infrastructure.Setup;
using eShopForecast;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace eShopDashboard
{
    public class Program
    {
        private static int _seedingProgress = 100;

        private static RiskDTO risk =  new RiskDTO();

        public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseStartup<Startup>()
                .UseSerilog()
                .ConfigureAppConfiguration((builderContext, config) =>
                {
                    config.AddEnvironmentVariables();
                })
                .Build();

        public static int GetSeedingProgress()
        {
            return _seedingProgress;
        }

        public static int Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Debug()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .WriteTo.Seq("http://localhost:5341/")
                .CreateLogger();

            Log.Information("----- Starting web host");

            try
            {
                var host = BuildWebHost(args);

                Log.Information("----- Seeding Database");

                Task seeding = Task.Run(async () => { await ConfigureDatabaseAsync(host); });

                PopulateRiskData();

                Log.Information("----- Running Host");

                host.Run();

                Log.Information("----- Web host stopped");

                return 0;
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "----- Host terminated unexpectedly");

                return 1;
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        private static async Task ConfigureDatabaseAsync(IWebHost host)
        {
            _seedingProgress = 0;

            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;

                var catalogContext = services.GetService<CatalogContext>();
                await catalogContext.Database.MigrateAsync();

                var orderingContext = services.GetService<OrderingContext>();
                await orderingContext.Database.MigrateAsync();
            }

            await SeedDatabaseAsync(host);

            _seedingProgress = 100;
        }

        private static async Task SeedDatabaseAsync(IWebHost host)
        {
            try
            {
                using (var scope = host.Services.CreateScope())
                {
                    IServiceProvider services = scope.ServiceProvider;

                    Log.Information("----- Checking seeding status");

                    var catalogContextSetup = services.GetService<CatalogContextSetup>();
                    var orderingContextSetup = services.GetService<OrderingContextSetup>();

                    var catalogSeedingStatus = await catalogContextSetup.GetSeedingStatusAsync();
                    Log.Information("----- SeedingStatus ({Context}): {@SeedingStatus}", "Catalog", catalogSeedingStatus);

                    var orderingSeedingStatus = await orderingContextSetup.GetSeedingStatusAsync();
                    Log.Information("----- SeedingStatus ({Context}): {@SeedingStatus}", "Ordering", orderingSeedingStatus);

                    var seedingStatus = new SeedingStatus(catalogSeedingStatus, orderingSeedingStatus);
                    Log.Information("----- SeedingStatus ({Context}): {@SeedingStatus}", "Aggregated", seedingStatus);

                    if (!seedingStatus.NeedsSeeding)
                    {
                        Log.Information("----- No seeding needed");

                        return;
                    }

                    Log.Information("----- Seeding database");

                    var sw = new Stopwatch();
                    sw.Start();

                    void ProgressAggregator()
                    {
                        seedingStatus.RecordsLoaded = catalogSeedingStatus.RecordsLoaded + orderingSeedingStatus.RecordsLoaded;

                        Log.Debug("----- Seeding {SeedingPercentComplete}% complete", seedingStatus.PercentComplete);
                        _seedingProgress = seedingStatus.PercentComplete;
                    }

                    var catalogProgressHandler = new Progress<int>(value =>
                    {
                        catalogSeedingStatus.RecordsLoaded = value;
                        ProgressAggregator();
                    });

                    var orderingProgressHandler = new Progress<int>(value =>
                    {
                        orderingSeedingStatus.RecordsLoaded = value;
                        ProgressAggregator();
                    });

                    Log.Information("----- Seeding CatalogContext");
                    Task catalogSeedingTask = Task.Run(async () => await catalogContextSetup.SeedAsync(catalogProgressHandler));

                    Log.Information("----- Seeding OrderingContext");
                    Task orderingSeedingTask = Task.Run(async () => await orderingContextSetup.SeedAsync(orderingProgressHandler));

                    await Task.WhenAll(catalogSeedingTask, orderingSeedingTask);

                    seedingStatus.SetAsComplete();
                    _seedingProgress = seedingStatus.PercentComplete;

                    Log.Information("----- Database Seeded ({ElapsedTime:n3}s)", sw.Elapsed.TotalSeconds);
                }

            }
            catch (Exception ex)
            {
                Log.Error(ex, "----- Exception seeding database");
            }
        }

        private static void PopulateRiskData()
        {
            //var calculatedCount = MathF.Round(singleProductSeries.Select(p => p.count).Average()) - randomCountDelta;
            //var calculatedMax = MathF.Round(singleProductSeries.Select(p => p.max).Average()) - randomMaxDelta;
            //var calculatedMin = new Random().Next(1, 5);

            for (int i = 0; i < 100; i++)
            {
                risk.risk1.Add(new RiskData
                {
                    riskId = 1,
                    day = -100 + i,
                    count = 100,
                    riskValue = new Random().Next(0, 100)
                });

                risk.riskBase1.Add(new RiskBaseData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskBaseValue = (new Random().Next(0, 100))/10.0f // $10M
                });

                risk.riskImpact1.Add(new RiskImpactData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskImpactValue = (new Random().Next(0, 100)) / 10.0f // $10M
                });

                risk.risk2.Add(new RiskData
                {
                    riskId = 1,
                    day = -100 + i,
                    count = 100,
                    riskValue = new Random().Next(0, 100)
                });

                risk.riskBase2.Add(new RiskBaseData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskBaseValue = (new Random().Next(0, 100)) / 10.0f // $10M
                });

                risk.riskImpact2.Add(new RiskImpactData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskImpactValue = (new Random().Next(0, 100)) / 10.0f // $10M
                });

                risk.riskImpactEntity.Add(new RiskImpactData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskImpactValue = (new Random().Next(0, 100)) / 10.0f // $10M
                });

            }

            for (int i = 0; i < 20; i++)
            {
                float riskValue1 = new Random().Next(0, 100);
                float riskValue1min = riskValue1 - (i + 1);
                float riskValue1max = riskValue1 + (i + 1);
                float riskValue2 = new Random().Next(0, 100);
                float riskValue2min = riskValue2 - (i + 1);
                float riskValue2max = riskValue2 + (i + 1);

                float riskBaseValue1 = new Random().Next(0, 100) / 10.0f;
                float riskBaseValue1min = riskBaseValue1 - (i + 1) / 10.0f;
                float riskBaseValue1max = riskBaseValue1 + (i + 1) / 10.0f;
                float riskBaseValue2 = new Random().Next(0, 100) / 10.0f;
                float riskBaseValue2min = riskBaseValue2 - (i + 1) / 10.0f;
                float riskBaseValue2max = riskBaseValue2 + (i + 1) / 10.0f;

                float riskImpactValue1 = riskValue1 * riskBaseValue1;
                float riskImpactValue1min = riskValue1min * riskBaseValue1min;
                float riskImpactValue1max = riskValue1max * riskBaseValue1max;
                float riskImpactValue2 = riskValue2 * riskBaseValue2;
                float riskImpactValue2min = riskValue2min * riskBaseValue2min;
                float riskImpactValue2max = riskValue2max * riskBaseValue2max;

                float riskImpactEntityValue = riskImpactValue1 + riskImpactValue2;
                float riskImpactEntityValuemin = riskImpactValue1min + riskImpactValue2max;
                float riskImpactEntityValuemax = riskImpactValue1max + riskImpactValue2max;

                risk.risk1.Add(new RiskData
                {
                    riskId = 1,
                    day = i,
                    count = 100,
                    riskValue = riskValue1,
                    min = riskValue1min,
                    max = riskValue1max
                });

                risk.riskBase1.Add(new RiskBaseData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskBaseValue = riskBaseValue1,
                    min = riskBaseValue1min,
                    max = riskBaseValue1max
                });

                risk.riskImpact1.Add(new RiskImpactData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskImpactValue = riskImpactValue1,
                    min = riskImpactValue1min,
                    max = riskImpactValue1max
                });

                risk.risk2.Add(new RiskData
                {
                    riskId = 1,
                    day = -100 + i,
                    count = 100,
                    riskValue = riskValue2,
                    min = riskValue2min,
                    max = riskValue2max
                });

                risk.riskBase2.Add(new RiskBaseData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskBaseValue = riskBaseValue2,
                    min = riskBaseValue2min,
                    max = riskBaseValue2max
                });

                risk.riskImpact2.Add(new RiskImpactData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskImpactValue = riskImpactValue2,
                    min = riskImpactValue2min,
                    max = riskImpactValue2max
                });

                risk.riskImpactEntity.Add(new RiskImpactData
                {
                    riskId = 2,
                    day = -100 + i,
                    count = 100,
                    riskImpactValue = riskImpactEntityValue,
                    min = riskImpactEntityValuemin,
                    max = riskImpactEntityValuemax
                });

            }
        }

        public static RiskDTO GetRiskData()
            => risk;
    }
}
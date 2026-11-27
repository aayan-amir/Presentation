import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests',
  workers:1,
  timeout:60_000,
  use:{baseURL:'http://127.0.0.1:4325',trace:'retain-on-failure'},
  webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4325',url:'http://127.0.0.1:4325',reuseExistingServer:true,env:{ASTRO_TELEMETRY_DISABLED:'1'}},
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome'],launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}}},
    {name:'firefox',use:{...devices['Desktop Firefox']}},
    {name:'webkit',use:{...devices['Desktop Safari']}},
    {name:'phone',use:{...devices['iPhone 13']}},
  ],
});

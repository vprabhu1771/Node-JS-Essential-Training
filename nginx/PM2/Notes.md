When you update routes/backend code and it's not working with PM2, here are the common issues and solutions:

## 1. **Restart PM2 Process**
PM2 caches your code in memory. You need to restart it:

```bash
# List all PM2 processes
pm2 list

# Restart your specific process (replace 'app' with your process name)
pm2 restart app

# Or restart all processes
pm2 restart all

# If you want to reload without downtime (if using cluster mode)
pm2 reload app

# Force restart (kills and restarts)
pm2 restart app --update-env
```

## 2. **Clear PM2 Cache**
Sometimes PM2 caches modules:

```bash
# Delete the process completely
pm2 delete app

# Start fresh
pm2 start ecosystem.config.js

# Or start directly
pm2 start server.js --name app
```

## 3. **Check for Errors**
View logs to see what's happening:

```bash
# Show real-time logs
pm2 logs app

# Show last 100 lines
pm2 logs app --lines 100

# Show error logs only
pm2 logs app --err

# Show all logs for all processes
pm2 logs
```

## 4. **Verify File Changes**
Make sure your file changes are actually saved:

```bash
# Check if your file has the changes
cat routes/live-tracking.js

# Or use nano/vim to verify
nano routes/live-tracking.js
```

## 5. **Check Node.js Module Cache**
Sometimes Node.js caches require modules:

```javascript
// Add this temporarily to your route file to force reload
console.log('🔄 Live tracking route loaded at:', new Date().toISOString());
```

## 6. **Complete PM2 Reset Process**

```bash
# Step 1: Stop the process
pm2 stop app

# Step 2: Delete the process
pm2 delete app

# Step 3: Clear PM2 logs
pm2 flush

# Step 4: Kill PM2 daemon (if needed)
pm2 kill

# Step 5: Start PM2 again
pm2 start server.js --name app

# Step 6: Save the process list
pm2 save

# Step 7: Generate startup script (if needed)
pm2 startup
```

## 7. **Environment Variables**
If you're using environment variables, make sure they're loaded:

```bash
# Restart with environment variables
pm2 restart app --update-env

# Or if using ecosystem.config.js
pm2 restart ecosystem.config.js --update-env
```

## 8. **Check File Permissions**
Make sure PM2 has permission to read the file:

```bash
# Check file permissions
ls -la routes/live-tracking.js

# If needed, change permissions
chmod 644 routes/live-tracking.js
```

## 9. **Use Ecosystem File (Recommended)**
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'app',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: ['server.js', 'routes'], // Watch for changes
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    // Clear require cache on restart
    kill_timeout: 3000,
    listen_timeout: 5000,
    // Force restart on file change
    watch_options: {
      followSymlinks: false,
      usePolling: true,
      interval: 1000,
    }
  }]
};
```

Then run:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## 10. **Debug Mode**
Run in debug mode to see what's happening:

```bash
# Start with --no-daemon to see logs in real-time
pm2 start server.js --name app --no-daemon

# Or use nodemon with PM2
pm2 start server.js --name app --watch --ignore-watch="node_modules"
```

## 11. **Check Route Registration**
Make sure your route is properly registered in `server.js` or `app.js`:

```javascript
// server.js or app.js
const liveTrackingRoutes = require('./routes/live-tracking');
app.use('/api/v1/admin', liveTrackingRoutes);
```

## 12. **Complete Reset Script**
Create a `reset-pm2.sh` script:

```bash
#!/bin/bash

echo "🔄 Resetting PM2..."

# Stop all processes
pm2 stop all

# Delete all processes
pm2 delete all

# Kill PM2 daemon
pm2 kill

# Clear logs
pm2 flush

# Wait 2 seconds
sleep 2

# Start your app
pm2 start server.js --name app

# Save the process list
pm2 save

# Show status
pm2 list
pm2 logs app --lines 20

echo "✅ PM2 reset complete!"
```

Make it executable and run:
```bash
chmod +x reset-pm2.sh
./reset-pm2.sh
```

## 13. **Test API After Restart**
After restarting, test your API:

```bash
# Test the live tracking endpoint
curl -X GET http://localhost:3000/api/v1/admin/live-tracking \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Or use the browser console to test
```

## 14. **Check Database Changes**
Make sure the database schema matches your query:

```sql
-- Check if all columns exist
DESCRIBE drivers;
DESCRIBE vehicles;

-- Check if there are any drivers with status
SELECT id, name, online_status FROM drivers;
```

## 15. **Most Common Fix - Force Reload**
This usually solves 90% of the issues:

```bash
# Step 1: Kill everything
pm2 kill

# Step 2: Clear node cache (optional)
rm -rf node_modules/.cache

# Step 3: Start fresh
pm2 start server.js --name app

# Step 4: Save
pm2 save

# Step 5: Check logs
pm2 logs app --lines 50
```

**If it's still not working:**

1. **Check if route file is actually being used**:
   ```bash
   # Add a console.log at the top of the route file
   console.log('✅ LIVE TRACKING ROUTE LOADED');
   ```

2. **Check PM2 logs**:
   ```bash
   pm2 logs app --lines 100
   ```

3. **Check if there are syntax errors**:
   ```bash
   node -c routes/live-tracking.js
   ```

4. **Verify the route is registered**:
   ```bash
   # Add this to see all registered routes
   console.log('Registered routes:', app._router.stack.map(r => r.route?.path).filter(Boolean));
   ```

Try these steps and let me know what error messages you see in the PM2 logs!

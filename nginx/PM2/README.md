## Step 8: Monitor Fix
```bash
# Monitor in real-time
pm2 monit

# Check if restarts stop
pm2 status  # ↺ should stop increasing
```

# Check PM2 status
```
pm2 status
```

# If not running, start it
```
pm2 start server.js --name "backend"
```

# Check if port 5000 is listening
```
sudo netstat -tlnp | grep 5000
```
# or
```
sudo ss -tlnp | grep 5000
```

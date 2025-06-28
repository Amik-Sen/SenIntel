// headers and import
import fs from "fs";
import path from "path";

// Credential and Secrets for sending logs
require('dotenv').config();
backend_log_api = process.env.MONITOR_DB_URL;

// main sdk class
class SenIntelSDK {
  constructor({ endpoint, app, mode, localLogPath }) {
    const validModes = ["local", "server"];
  
    // check on the value of the mode is valid or not
    if (!validModes.includes(mode)) {
      throw new Error(
        `Invalid mode "${mode}". Expected one of: ${validModes.join(", ")}.`
      );
    }

    // initialise variable
    this.endpoint = endpoint;
    this.app = app;
    this.mode = mode;
    this.buffer = [];
    this.flushInterval = 5000; // ms
    this.maxBufferSize = 10;
    this.localLogPath = mode === "local"
        ? this._resolveLogPath(localLogPath)
        : undefined;
  
    // initial flushes and intialisation 
    this._startFlushLoop();
    this._initialize();

  }

  // this functions can be used 
  async _request(method, path, options = {}) {
    const url = new URL(`${this.endpoint}${path}`);
    const startTime = Date.now();

    let res;
    let responseBody;
    try {
      const fetchOptions = {
        method,
        headers: this.headers,
        ...(options.body && { body: JSON.stringify(options.body) }),
      };

      if (method === "GET" && options.params) {
        Object.entries(options.params).forEach(([k, v]) =>
          url.searchParams.append(k, v)
        );
      }

      res = await fetch(url.toString(), fetchOptions);
      responseBody = await res.json();
    } catch (err) {
      this.log("error", `HTTP ${method} ${path} failed`, {
        error: err.message,
        duration: Date.now() - startTime,
      });
      throw err;
    }

    // Log successful request
    this.log("info", `HTTP ${method} ${path}`, {
      status: res.status,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    return responseBody;
  }

  // all requests from the logger
  get(path, params = {}) {
    return this._request("GET", path, { params });
  }

  post(path, body = {}) {
    return this._request("POST", path, { body });
  }

  put(path, body = {}) {
    return this._request("PUT", path, { body });
  }

  delete(path) {
    return this._request("DELETE", path);
  }

  log(type, message, context = {}) {
    const entry = {
      timestamp: Date.now(),
      type,
      message,
      app: this.app,
      context,
    };
    if(this.mode == "")
    this.buffer.push(entry);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  flush() {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    fetch(`${backend_log_api}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logs),
    }).catch(() => {
      // Optional: re-buffer or silently fail
    });
  }


  // Clean the buffer and flush to server
  _startFlushLoop() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  // Set the local path correctly
  _resolveLogPath(userPath) {
    // If path is missing, use default path
    if (!userPath) return path.resolve("logs", "SenIntel.json");

    const fullPath = path.resolve(userPath);

    // If path ends in a slash or is a directory, append filename
    if (
      fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()
    ) {
      return path.join(fullPath, "SenIntel.json");
    }

    // If path ends in .json or has filename, return as-is
    return fullPath.endsWith(".json")
      ? fullPath
      : path.join(fullPath, "SenIntel.json");
  }


  // Confirmation after the SDK has initialised 
  async _initialize(){
    // check for local mode and settings
    if (this.mode === "local") {
      const dir = path.dirname(this.localLogPath);
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(this.localLogPath)) {
          fs.writeFileSync(this.localLogPath, "[]");
        }

        fs.accessSync(this.localLogPath, fs.constants.W_OK);
        
        // Confirmation after everything is set up
        console.log("✅ SenIntelSDK configured successfully in LOCAL mode");
        console.log(`📂 Logs will be written to: ${this.localLogPath}`);
      } catch (err) {
        throw new Error(`❌ SenIntelSDK could not be configured: ${err.message}`);
      }
    }

    else if (this.mode === "server") {
      try {
        const res = await fetch(this.endpoint + "/ping"); // ping endpoint
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log(`✅ SenIntelSDK configured successfully in SERVER mode`);
      } catch (err) {
        throw new Error("❌ SenIntelSDK could not be configured:", err.message);
      }
    }
  }
}

export default SenIntelSDK;

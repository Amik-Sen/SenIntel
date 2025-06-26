# SenIntel! :smile:

As I plan to make a lot of apps, monitoring them is gonna be crucial and I want a light weight monitoring system with My own sexy UI. My name is Amik Sen, Hence presenting to you all SenIntel! :applause:

Now this will be built in an iterative manner and I hope anybody (if I am lucky enough) using this is the future, can learn from my mistakes!
Although I hope you make a tons of your own mistakes and learn! :wink:

For Starters I am going with an Architecture pattern as shown below:
Will change this if required and with reasons for the change

![SenIntel Initial Architecture](./Documentation/SenIntel.png)

Now initially I thought of this central architecture, and this is how I wish to use my SenIntel instance.
But for someone who just wants casual logging and monitoring of performance of your App or API, we can keep a local mode as well! 
So we will have two modes in the SDK:
- `local` - creates a seperate json file in the project itself, and the dashboard uses this file.
- `server` - give the server details and credentials, that will be used as the source for the dashboard.

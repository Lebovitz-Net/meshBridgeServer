# Project File Structure

│—— docs
│  │—— achitecture.md
│  │—— data driven architecture.md
│  │—— enhanced_state_machine.md
│  │—— entity-diagram.png
│  │—— filestructure.md
│  │—— implmenting-ack.md
│  │—— latest-chat.txt
│  │—— packets-architecture.md
│  │—— packets.md
│  │—— tagging-and-tracing-connections.md
│  ╵—— websocket-tagging.md
│—— env
│  │—— .env
│  │—— .env.local
│  ╵—— .env.production
│—— proto
│  │—— protobufs
│  │  │—— .git
│  │  │  │—— branches
│  │  │  │—— hooks
│  │  │  │  │—— applypatch-msg.sample
│  │  │  │  │—— commit-msg.sample
│  │  │  │  │—— fsmonitor-watchman.sample
│  │  │  │  │—— post-update.sample
│  │  │  │  │—— pre-applypatch.sample
│  │  │  │  │—— pre-commit.sample
│  │  │  │  │—— pre-merge-commit.sample
│  │  │  │  │—— pre-push.sample
│  │  │  │  │—— pre-rebase.sample
│  │  │  │  │—— pre-receive.sample
│  │  │  │  │—— prepare-commit-msg.sample
│  │  │  │  │—— push-to-checkout.sample
│  │  │  │  │—— sendemail-validate.sample
│  │  │  │  ╵—— update.sample
│  │  │  │—— info
│  │  │  │  ╵—— exclude
│  │  │  │—— logs
│  │  │  │  │—— refs
│  │  │  │  │  │—— heads
│  │  │  │  │  │  ╵—— master
│  │  │  │  │  ╵—— remotes
│  │  │  │  │  │  ╵—— origin
│  │  │  │  │  │  │  ╵—— HEAD
│  │  │  │  ╵—— HEAD
│  │  │  │—— objects
│  │  │  │  │—— info
│  │  │  │  ╵—— pack
│  │  │  │  │  │—— pack-1f993831d701d3f221d696d32822e02dc6a22508.idx
│  │  │  │  │  │—— pack-1f993831d701d3f221d696d32822e02dc6a22508.pack
│  │  │  │  │  ╵—— pack-1f993831d701d3f221d696d32822e02dc6a22508.rev
│  │  │  │—— refs
│  │  │  │  │—— heads
│  │  │  │  │  ╵—— master
│  │  │  │  │—— remotes
│  │  │  │  │  ╵—— origin
│  │  │  │  │  │  ╵—— HEAD
│  │  │  │  ╵—— tags
│  │  │  │—— config
│  │  │  │—— description
│  │  │  │—— HEAD
│  │  │  │—— index
│  │  │  ╵—— packed-refs
│  │  │—— .github
│  │  │  │—— workflows
│  │  │  │  │—— ci.yml
│  │  │  │  │—— create_tag.yml
│  │  │  │  │—— publish.yml
│  │  │  │  ╵—— pull_request.yml
│  │  │  ╵—— pull_request_template.md
│  │  │—— .vscode
│  │  │  │—— extensions.json
│  │  │  ╵—— settings.json
│  │  │—— meshtastic
│  │  │  │—— admin.options
│  │  │  │—— admin.proto
│  │  │  │—— apponly.options
│  │  │  │—— apponly.proto
│  │  │  │—— atak.options
│  │  │  │—— atak.proto
│  │  │  │—— cannedmessages.options
│  │  │  │—— cannedmessages.proto
│  │  │  │—— channel.options
│  │  │  │—— channel.proto
│  │  │  │—— clientonly.options
│  │  │  │—— clientonly.proto
│  │  │  │—— config.options
│  │  │  │—— config.proto
│  │  │  │—— connection_status.options
│  │  │  │—— connection_status.proto
│  │  │  │—— deviceonly.options
│  │  │  │—— deviceonly.proto
│  │  │  │—— device_ui.options
│  │  │  │—— device_ui.proto
│  │  │  │—— interdevice.options
│  │  │  │—— interdevice.proto
│  │  │  │—— localonly.proto
│  │  │  │—— mesh.options
│  │  │  │—— mesh.proto
│  │  │  │—— module_config.options
│  │  │  │—— module_config.proto
│  │  │  │—— mqtt.options
│  │  │  │—— mqtt.proto
│  │  │  │—— paxcount.proto
│  │  │  │—— portnums.proto
│  │  │  │—— powermon.proto
│  │  │  │—— remote_hardware.proto
│  │  │  │—— rtttl.options
│  │  │  │—— rtttl.proto
│  │  │  │—— storeforward.options
│  │  │  │—— storeforward.proto
│  │  │  │—— telemetry.options
│  │  │  │—— telemetry.proto
│  │  │  │—— xmodem.options
│  │  │  ╵—— xmodem.proto
│  │  │—— .gitattributes
│  │  │—— .gitignore
│  │  │—— buf.yaml
│  │  │—— LICENSE
│  │  │—— nanopb.proto
│  │  │—— package-lock.json
│  │  │—— package.json
│  │  │—— README.md
│  │  ╵—— renovate.json
│  ╵—— make-json.ps1
│—— public
│  ╵—— vite.svg
│—— scripts
│  │—— buildSchema.js
│  ╵—— testMQTTIngestion.js
│—— src
│  │—— api
│  │—— assets
│  │  │—— proto.json
│  │  │—— proto.json.old
│  │  │—— proto.json.txt
│  │  ╵—— react.svg
│  │—— bridge
│  │  │—— api
│  │  │  │—— handlers.js
│  │  │  ╵—— routes.js
│  │  │—— config
│  │  │  ╵—— config.js
│  │  │—— core
│  │  │  │—— connectionManager.js
│  │  │  │—— frameParser.js
│  │  │  │—— fromRadioRouter.js
│  │  │  │—— ingestionRouter.js
│  │  │  │—— router.js
│  │  │  │—— scheduleReconnect.js
│  │  │  │—— schema.js
│  │  │  │—— sessionRegistry.js
│  │  │  ╵—— websocketEmitter.js
│  │  │—— db
│  │  │  │—— dbschema.js
│  │  │  │—— insertMetrics.js
│  │  │  │—— insertUserInfo.js
│  │  │  ╵—— queryHandlers.js
│  │  │—— handlers
│  │  │  │—— mqttHandler.js
│  │  │  │—— tcpHandler.js
│  │  │  │—— tcpServerHandler.js
│  │  │  │—— websocketHandler.js
│  │  │  ╵—— websocketSessionHandler.js
│  │  │—— packets
│  │  │  │—— packetCatagorizer.js
│  │  │  │—— packetDecoders.js
│  │  │  │—— packetEnrich.js
│  │  │  │—— packetIndex.js
│  │  │  │—— packetLogger.js
│  │  │  ╵—— packetUtils.js
│  │  ╵—— routes
│  │  │  ╵—— runtimeConfigRoutes.js
│  │—— components
│  │  │—— Config
│  │  │  │—— GPSTelemetry.jsx
│  │  │  │—— IdentityTab.jsx
│  │  │  │—— LogAlerts.jsx
│  │  │  │—— Metrics.jsx
│  │  │  │—— OTAUpdates.jsx
│  │  │  │—— RadioConfig.bkp
│  │  │  │—— RadioConfig.jsx
│  │  │  │—— SettingsDrawer.bkp
│  │  │  │—— SettingsDrawer.jsx
│  │  │  ╵—— TelemetryTab.jsx
│  │  │—— Metrics
│  │  │—— Navigation
│  │  │  │—— Menu.jsx
│  │  │  │—— SideBar.jsx
│  │  │  │—— SidebarTabs.jsx
│  │  │  │—— TabContent.jsx
│  │  │  │—— TopBar.jsx
│  │  │  ╵—— TopToolbar.jsx
│  │  │—— Tabs
│  │  │  │—— ChannelCard.jsx
│  │  │  │—— Channels.jsx
│  │  │  │—— ConnectionCard.jsx
│  │  │  │—— ConnectionCreate.jsx
│  │  │  │—— Connections.jsx
│  │  │  │—— Contacts.jsx
│  │  │  │—— ContactsTab.jsx
│  │  │  │—— Map.jsx
│  │  │  │—— MessageCard.jsx
│  │  │  │—— MessageDetails.jsx
│  │  │  │—— MessageList.jsx
│  │  │  │—— NodeCard.jsx
│  │  │  │—— NodeDetails.jsx
│  │  │  │—— Nodes.jsx
│  │  │  │—— NodeSelector.jsx
│  │  │  ╵—— TestTab.jsx
│  │  ╵—— UserInfo
│  │—— hooks
│  │  │—— diagnostics.js
│  │  │—— useBridgeLifecycle.js
│  │  │—— useMeshSocketBridge.js
│  │  │—— useNodeDiagnostics.js
│  │  │—— useNodesState.js
│  │  │—— useNodeSubscription.js
│  │  │—— useSocketInterface.js
│  │  │—— useStateTracker.js
│  │  ╵—— useTCPNodes.js
│  │—— pages
│  │  │—— ContactsPage.jsx
│  │  │—— HomePage.jsx
│  │  ╵—— MessageListPage.jsx
│  │—— utils
│  │  │—— bridgeAdapter.js
│  │  │—— decodeFrame.js
│  │  │—— decodeNodesResponse.js
│  │  │—— eventUtils.js
│  │  │—— handlePacket.js
│  │  │—— mockFirmwareData.js
│  │  │—— nodeEvents.js
│  │  │—— protobufsUtils.js
│  │  │—— protoDescriptor.js
│  │  │—— protoHelpers.js
│  │  │—— protoValidate.js
│  │  │—— safeDecodeMeshPacket.js
│  │  │—— TCPMessage.js
│  │  ╵—— waitForSocketReady.js
│  │—— validators
│  │  ╵—— adminMessageLogger.js
│  │—— App.css
│  │—— App.jsx
│  │—— App.test.js
│  │—— counter.js
│  │—— index.css
│  │—— javascript.svg
│  │—— logo.svg
│  │—— main.jsx
│  │—— reportWebVitals.js
│  │—— setupTests.js
│  ╵—— style.css
│—— unused
│  │—— deviceConfigRoutes.js
│  │—— Home.jsx
│  │—— MeshtasticClient.jsx
│  │—— MeshtasticConfig.jsx
│  │—— metricsRoutes.js
│  │—— NodeIdentity.jsx
│  │—— NodesPage.jsx
│  │—— NotFoundPage.jsx
│  │—— useFlowControl.js
│  │—— useMeshBridge.js.disabled
│  │—— useMeshLifeCycle.js
│  │—— useMeshMessages.js.disabled
│  │—— useMeshWebSocket.js.disabled
│  │—— useNodesList.js.disabled
│  │—— userInfoRouters.js
│  ╵—— useWebSocket.js.disabled
│—— .env
│—— .env.local
│—— .env.production
│—— .gitattributes
│—— .gitignore
│—— ARCHITECTURE.md
│—— config.yaml
│—— CONTRIBUTING.md
│—— DISCUSSIONS.md
│—— filestructure.md
│—— filestructure.ps1
│—— index.html
│—— LICENSE.md
│—— meshmanager.code-workspace
│—— meshmanager.db
│—— package-lock.json
│—— package.json
│—— README.md
│—— rewrite-imports.py
│—— server.js
│—— vite.config.js
╵—— vite.config.js.new

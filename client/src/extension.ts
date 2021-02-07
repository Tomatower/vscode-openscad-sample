import * as path from 'path';
import * as net from 'net';
import { workspace, ExtensionContext, commands, window, OutputChannel } from 'vscode';
import { Range, URI } from 'vscode-languageserver-types';
import { ProtocolRequestType } from 'vscode-languageserver-protocol';
import { HandlerResult, RequestHandler } from 'vscode-jsonrpc';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
    TransportKind,
    StreamInfo,
	Trace,
	RevealOutputChannelOn
} from 'vscode-languageclient/node';
import { downloadAndUnzipVSCode } from 'vscode-test';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	const outputChannel: OutputChannel = window.createOutputChannel("OpenSCAD");
    // The server is implemented in node
	let connectionInfo = {
		port: 23725, // 0x5cad
		host: "localhost"
	};

	let serverOptions = () => {
        // Connect to language server via socket
        let socket = net.connect(connectionInfo);
        let result: StreamInfo = {
            writer: socket,
            reader: socket
		};

		outputChannel.appendLine('[client] Connecting to openscad on port ' + connectionInfo.port);
		console.log("Opening connection to " + connectionInfo.host + ":" + connectionInfo.port);

		return Promise.resolve(result)
    };


	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		},
		outputChannel,
		outputChannelName: 'OpenSCAD',
		revealOutputChannelOn: RevealOutputChannelOn.Info,
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'openscad-lsp',
		'OpenSCAD Language Server',
		serverOptions,
		clientOptions
	);
	client.registerProposedFeatures();

	// enable tracing (.Off, .Messages, Verbose)
    client.trace = Trace.Verbose;

	// Start the client. This will also launch the server
	let disposable = client.start();

	// Push the disposable to the context's subscriptions so that the

    // client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

	context.subscriptions.push(
		commands.registerCommand("openscad.preview", (e) => {
			outputChannel.appendLine('[client] Preview requested' + window.activeTextEditor.document.uri);

			client.sendRequest("$openscad/preview", {uri: window.activeTextEditor.document.uri.toString() });
		})
	);

	client.onReady().then(() => {
		outputChannel.appendLine('[client] Connection has been established');

		commands.executeCommand('openscad.preview');
	})

}
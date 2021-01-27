import * as path from 'path';
import * as net from 'net';
import { workspace, ExtensionContext } from 'vscode';
import { Range, URI } from 'vscode-languageserver-types';
import { ProtocolRequestType } from 'vscode-languageserver-protocol';
import { HandlerResult, RequestHandler } from 'vscode-jsonrpc';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
    TransportKind,
    StreamInfo,
    Trace
} from 'vscode-languageclient/node';

let client: LanguageClient;

interface SendExperimentalParams {
	message: string;
	uri: URI;
}

interface SendExperimentalResult {
	message: string;
}

declare namespace SendExperimentalRequest {
    const method: '$openscad/test';
    const type: ProtocolRequestType<SendExperimentalParams, SendExperimentalResult, void, void, void>;
    type HandlerSignature = RequestHandler<SendExperimentalParams, SendExperimentalResult, void>;
    type MiddlewareSignature = (params: SendExperimentalParams, next: HandlerSignature) => HandlerResult<SendExperimentalResult, void>;
}

export function activate(context: ExtensionContext) {
    // The server is implemented in node
	let connectionInfo = {
		port: 23725, // 0x5cad
		host: "localhost"
	};

    /*
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
    };*/
	let serverOptions = () => {
        // Connect to language server via socket
        let socket = net.connect(connectionInfo);
        let result: StreamInfo = {
            writer: socket,
            reader: socket
		};

		console.log("Opening connection to " + connectionInfo.host + ":" + connectionInfo.port);

        return Promise.resolve(result);
    };


	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        },
        outputChannelName: 'OpenSCAD Language Server',
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);
    // enable tracing (.Off, .Messages, Verbose)
    client.trace = Trace.Verbose;

	// Start the client. This will also launch the server
    let disposable = client.start();

	console.log("Client has been started");



    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

/*
	const test: SendExperimentalParams = {
		message: "Hello World",
		uri: "file:///dev/zero",
	};

	client.onReady().then(() => {
		console.log("Client is ready, sending message");
		client.sendRequest(SendExperimentalRequest.type, test).then((e) => {
			console.log("Got experimental answer", e);
		});
	})
*/
}
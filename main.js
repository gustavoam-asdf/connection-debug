import 'dotenv/config'

import { Agent } from 'node:https';
import axios from 'axios';
import { createClientAsync } from "soap";
import fs from 'node:fs/promises';

export async function createWebServiceClient(url, options) {
	const client = await createClientAsync(url, options);
	return client;
}

async function createEjbcaClient(p12FilePath) {
	const pfx = await fs.readFile(p12FilePath)

	const httpsAgent = new Agent({
		pfx,
		passphrase: process.env.CA_CERTIFICATE_PASSPHRASE,
	})

	const authorizedAxios = axios.create({
		httpsAgent
	})

	const webServiceClientInstance = await createWebServiceClient(process.env.CA_WSDL_URL, {
		strict: true,
		request: authorizedAxios
	})

	return webServiceClientInstance;
}

async function main() {
	const rootDir = process.cwd()
	const p12FilePath = `${rootDir}/certs/${process.env.CA_CERTIFICATE_NAME}`

	const existsP12File = await fs.access(p12FilePath)
		.then(() => true)
		.catch(() => false)

	if (!existsP12File) {
		throw new Error(`File ${p12FilePath} not found`)
	}

	const ejbcaClient = await createEjbcaClient(p12FilePath)

	console.log(ejbcaClient)
}

main()
import https from 'https';
import http from 'http';
import { URL } from 'url';

export class SomniaJsonRpcClient {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  public async sendRpcRequest(method: string, params: any[] = []): Promise<any> {
    const parsedUrl = new URL(this.rpcUrl);
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 100000),
      method,
      params
    });

    const isHttps = parsedUrl.protocol === 'https:';
    const requestModule = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const req = requestModule.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(body);
              if (json.error) {
                reject(new Error(`RPC Error: ${json.error.message || JSON.stringify(json.error)}`));
              } else {
                resolve(json.result);
              }
            } catch (e) {
              reject(new Error(`Invalid RPC JSON response: ${body}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(err));
      req.write(payload);
      req.end();
    });
  }

  public async getChainId(): Promise<number> {
    const result = await this.sendRpcRequest('eth_chainId');
    return parseInt(result, 16);
  }

  public async getBlockNumber(): Promise<number> {
    const result = await this.sendRpcRequest('eth_blockNumber');
    return parseInt(result, 16);
  }

  public async getBalance(address: string): Promise<bigint> {
    const result = await this.sendRpcRequest('eth_getBalance', [address, 'latest']);
    return BigInt(result);
  }

  public async getCode(address: string): Promise<string> {
    return await this.sendRpcRequest('eth_getCode', [address, 'latest']);
  }

  public async call(to: string, data: string): Promise<string> {
    return await this.sendRpcRequest('eth_call', [{ to, data }, 'latest']);
  }

  public async estimateGas(to: string, data: string, from?: string): Promise<bigint> {
    const txObj: any = { to, data };
    if (from) txObj.from = from;
    const result = await this.sendRpcRequest('eth_estimateGas', [txObj]);
    return BigInt(result);
  }
}

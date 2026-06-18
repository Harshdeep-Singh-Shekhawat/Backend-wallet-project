import type { Config, Context, HandlerEvent, HandlerResponse } from '@netlify/functions';
import serverless from 'serverless-http';

import { app } from '../../src/app';

const handler = serverless(app);

const toEvent = async (req: Request): Promise<HandlerEvent> => {
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers.entries());
  const multiValueQueryStringParameters: Record<string, string[]> = {};

  url.searchParams.forEach((value, key) => {
    multiValueQueryStringParameters[key] = [
      ...(multiValueQueryStringParameters[key] || []),
      value,
    ];
  });

  const queryStringParameters = Object.fromEntries(
    Object.entries(multiValueQueryStringParameters).map(([key, values]) => [key, values[0]]),
  );

  return {
    rawUrl: req.url,
    rawQuery: url.searchParams.toString(),
    path: url.pathname,
    httpMethod: req.method,
    headers,
    multiValueHeaders: Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key, value ? [value] : undefined]),
    ),
    queryStringParameters,
    multiValueQueryStringParameters,
    body: ['GET', 'HEAD'].includes(req.method) ? null : await req.text(),
    isBase64Encoded: false,
  };
};

const toResponse = (result: HandlerResponse): Response => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(result.headers || {})) {
    headers.set(key, String(value));
  }

  for (const [key, values] of Object.entries(result.multiValueHeaders || {})) {
    for (const value of values) {
      headers.append(key, String(value));
    }
  }

  const body = result.isBase64Encoded && result.body
    ? Buffer.from(result.body, 'base64')
    : result.body;

  return new Response(body, {
    status: result.statusCode,
    headers,
  });
};

export default async (req: Request, context: Context) => {
  const event = await toEvent(req);
  const result = await handler(event, context as never);

  return toResponse(result as HandlerResponse);
};

export const config: Config = {
  path: '/api/*',
};

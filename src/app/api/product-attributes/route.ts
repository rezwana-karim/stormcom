import { NextResponse } from 'next/server';

// Simple in-memory store for development/demo purposes
// Using `let` because this array is mutated via .push() in POST handler
// eslint-disable-next-line prefer-const
let demoAttributes = [
  { id: '1', attributeId: '1', name: 'Color', value: 'Red' },
  { id: '2', attributeId: '2', name: 'Size', value: 'M' },
];

export async function GET() {
  return NextResponse.json({ attributes: demoAttributes });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const attr = {
      id: String(Date.now()),
      attributeId: body.attributeId || String(Date.now()),
      name: body.name || 'Custom',
      value: body.value || '',
    };
    demoAttributes.push(attr);
    return NextResponse.json({ attribute: attr }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

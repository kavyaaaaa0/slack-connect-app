import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing database connection...');
    const db = await getDb();
    console.log('Database connection successful');
    
    // Test a simple operation
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 });
  }
}

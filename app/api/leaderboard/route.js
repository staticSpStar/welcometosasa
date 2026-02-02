import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('welcometosasa');
        const leaderboard = await db.collection('leaderboard').find({}).toArray();

        return NextResponse.json(leaderboard);
    } catch (error) {
        return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A3:B8',
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return NextResponse.json([]);
        }

        // 헤더 스킵 없이 모든 행 처리
        const leaderboard = rows.map((row, index) => ({
            rank: index + 1,
            name: row[0] || '',
            score: parseInt(row[1]) || 0,
        }));

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Google Sheets 오류:', error);
        return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다' }, { status: 500 });
    }
}

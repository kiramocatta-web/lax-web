import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { feedback } = await req.json();

    await resend.emails.send({
      from: "LAX Feedback <admin@laxnlounge.com.au>",
      to: "admin@laxnlounge.com.au",
      subject: "New Anonymous Feedback",
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>New Feedback Submitted</h2>
          <p>${feedback}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
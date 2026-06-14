import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { identifier, type } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "IDENTIFIER_REQUIRED" },
        { status: 400 }
      );
    }

    // Verify format depending on type
    if (type === "operator") {
      // B2B Operator registered codes
      const validOperators = ["CSC_IN_0492", "CSC_DEL_7718", "CSC_MUM_9021", "DEV_SANDBOX"];
      if (!validOperators.includes(identifier.trim().toUpperCase())) {
        return NextResponse.json(
          { error: "OPERATOR_CODE_NOT_REGISTERED" },
          { status: 404 }
        );
      }
    } else {
      // Validate candidate email or phone number basic regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanId = identifier.trim();
      
      if (!emailRegex.test(cleanId) && !phoneRegex.test(cleanId.replace(/\s+/g, ""))) {
        return NextResponse.json(
          { error: "INVALID_IDENTIFIER_FORMAT (Requires valid Email or E.164 Mobile number)" },
          { status: 400 }
        );
      }
    }

    // In production: trigger SMS (e.g. Twilio) or Email (e.g. Resend, Sendgrid) API here.
    console.log(`[AUTH LOGGER] Generating verification sequence for ${identifier} (${type})`);

    return NextResponse.json({ success: true, message: "OTP_DISPATCHED" });
  } catch (error) {
    return NextResponse.json(
      { error: "INTERNAL_TRANSMISSION_ERROR" },
      { status: 500 }
    );
  }
}

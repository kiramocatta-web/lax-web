export const giftEmail = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f0f1f5;font-family:Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f1f5;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ede9e2;">

            <tr>
              <td>
                <img
                  src="https://www.laxnlounge.com.au/emails/gift-package.png"
                  width="600"
                  style="display:block;width:100%;height:auto;"
                  alt="LAX N LOUNGE Gift Package"
                />
              </td>
            </tr>

            <tr>
              <td style="padding:40px 32px 12px;text-align:center;">
                <h1 style="margin:0;font-size:34px;line-height:1.1;color:#2f2a24;">
                  Someone Gifted You Recovery.
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 26px;text-align:center;">
                <p style="margin:0;font-size:17px;line-height:1.7;color:#5a544d;">
                  Someone special thought you might need
                  <strong>{{gift_plan_label}}</strong>
                  and honestly… we couldn’t agree more.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 26px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#31291d;border-radius:22px;border:1px solid #4a4034;">
                  <tr>
                    <td style="padding:28px;text-align:center;">
                      <h2 style="margin:0 0 14px;font-size:24px;color:#ffffff;">
                        How to redeem
                      </h2>

                      <p style="margin:0;font-size:16px;line-height:1.7;color:#d8d2ca;">
                        Click below, create or log into your account, and we’ll attach the gifted recovery package to your profile.
                      </p>

                      <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#c8bfb5;font-style:italic;">
                        {{gift_message}}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:6px 24px 36px;">
                <a
                  href="{{CLAIM_URL}}"
                  style="display:inline-block;background:#31291d;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:14px;font-size:18px;font-weight:700;"
                >
                  Redeem Gift
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 34px;text-align:center;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:#5a544d;font-style:italic;">
                  Please note: you’ll need an account so your gifted sessions can be allocated correctly.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 24px;background:#323232;text-align:center;">
                <p style="margin:0;color:#ede9e2;font-size:14px;line-height:1.7;">
                  88 Cook Street, Northgate QLD
                  <br />
                  © LAX N LOUNGE
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
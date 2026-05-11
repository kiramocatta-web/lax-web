export const affiliateCodeUsedEmail = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f0f1f5;font-family:Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f1f5;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ede9e2;">
            <tr>
              <td>
                <img
                  src="https://yjnzdwxqkhizfeypr6oqlfaw3txbalo0_alnw_olssa.canva-cdn.email/4469890171a390b3a6a0499a22cfd8a6.jpg"
                  width="600"
                  style="display:block;width:100%;height:auto;"
                  alt="LAX N LOUNGE"
                />
              </td>
            </tr>

            <tr>
              <td style="padding:28px 28px 12px;text-align:center;color:#323232;font-size:19px;line-height:1.45;">
                <strong>Congratulations {{first_name}}!</strong>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 18px;text-align:center;color:#323232;font-size:18px;line-height:1.45;">
                Your affiliate code <strong>{{affiliate_code}}</strong> was just used in a purchase.
                <br /><br />
                You’ve earned <strong>{{credit_amount}}</strong> in affiliate credit.
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 18px;text-align:center;color:#323232;font-size:18px;line-height:1.45;">
                Your code has now been used <strong>{{used_count}}</strong> times.
                <br />
                Total affiliate balance: <strong>{{total_credit}}</strong>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 20px;text-align:center;color:#323232;font-size:18px;line-height:1.45;">
                Thank you for being an affiliate with LAX and supporting us.
                <br /><br />
                Don’t forget to keep tagging and sharing us!
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 28px;text-align:center;">
                <a
                  href="https://www.laxnlounge.com.au/profile"
                  style="display:inline-block;background:#31291d;color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:6px;font-size:18px;font-weight:700;font-style:italic;"
                >
                  View Profile
                </a>
              </td>
            </tr>

            <tr>
              <td style="background:#323232;padding:24px;text-align:center;color:#ede9e2;font-size:14px;line-height:1.5;">
                88 Cook Street, Northgate, QLD
                <br /><br />
                © LAX N LOUNGE
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
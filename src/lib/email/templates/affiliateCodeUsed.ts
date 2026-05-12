export const affiliateCodeUsedEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f0f1f5;
      font-family: Arial, Helvetica, sans-serif;
    }

    .wrapper {
      width: 100%;
      padding: 24px 12px;
      background-color: #f0f1f5;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ede9e2;
      overflow: hidden;
    }

    .hero-image {
      width: 100%;
      display: block;
    }

    .content {
      padding: 32px 28px;
      text-align: center;
      color: #323232;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 22px;
    }

    .text {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 22px;
    }

    .button {
      display: inline-block;
      background-color: #31291d;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 8px;
      font-size: 18px;
      font-style: italic;
      font-weight: 700;
      margin-top: 10px;
    }

    .footer {
      background-color: #323232;
      color: #ede9e2;
      text-align: center;
      padding: 32px 24px;
      font-size: 14px;
      line-height: 1.8;
    }

    .divider {
      width: 100%;
      height: 1px;
      background-color: #ede9e2;
      margin-bottom: 24px;
    }

    @media only screen and (max-width: 600px) {
      .content {
        padding: 28px 22px;
      }

      .title {
        font-size: 22px;
      }

      .text {
        font-size: 17px;
      }

      .button {
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
</head>

<body>
  <div class="wrapper">

    <div class="container">

      <img
        class="hero-image"
        src="https://www.laxnlounge.com.au/emails/affiliatecodeused.png"
        alt="Affiliate Code Used"
      />

      <div class="content">

        <div class="title">
          Congratulations {{first_name}}!
        </div>

        <div class="text">
          Your affiliate code <strong>{{affiliate_code}}</strong> was just used in a purchase.
          <br /><br />
          You’ve earned <strong>{{credit_amount}}</strong> in affiliate credit.
        </div>

        <div class="text">
          Your code has now been used <strong>{{used_count}}</strong> times.
          <br />
          Total affiliate balance: <strong>{{total_credit}}</strong>
        </div>

        <div class="text">
          Thank you for being an affiliate with LAX and supporting us.
          <br /><br />
          Don’t forget to keep tagging and sharing us!
        </div>

        <a
          href="https://www.laxnlounge.com.au/profile"
          class="button"
        >
          View Profile
        </a>

      </div>

      <div class="footer">

        <div class="divider"></div>

        88 Cook Street, Northgate, QLD

        <br /><br />

        © LAX N LOUNGE

      </div>

    </div>

  </div>
</body>
</html>
`;
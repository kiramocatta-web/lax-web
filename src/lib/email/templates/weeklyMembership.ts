// src/lib/email/templates/weeklyMembership.ts

export const weeklyMembershipTemplate = `
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
      padding: 32px 24px;
      text-align: center;
      color: #323232;
    }

    .text {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .button {
      display: inline-block;
      background-color: #31291d;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 18px;
      font-style: italic;
      font-weight: 700;
      margin: 8px 0 24px;
    }

    .benefits-title {
      font-size: 20px;
      margin: 24px 0 18px;
    }

    .benefits {
      display: table;
      width: 100%;
      border-spacing: 12px;
    }

    .benefit-card {
      display: table-cell;
      width: 33.33%;
      background-color: #31291d;
      color: #ffffff;
      border-radius: 10px;
      padding: 14px;
      vertical-align: top;
      text-align: left;
    }

    .benefit-card img {
      width: 100%;
      display: block;
      border-radius: 6px;
      margin-bottom: 14px;
    }

    .benefit-card h3 {
      margin: 0 0 12px;
      font-size: 18px;
      line-height: 1.3;
      font-style: italic;
      text-align: center;
    }

    .benefit-card p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
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
        padding: 28px 20px;
      }

      .text {
        font-size: 17px;
      }

      .button {
        width: 100%;
        box-sizing: border-box;
      }

      .benefits {
        display: block;
        border-spacing: 0;
      }

      .benefit-card {
        display: block;
        width: auto;
        margin-bottom: 16px;
      }
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="container">

      <img
        class="hero-image"
        src="https://www.laxnlounge.com.au/emails/memberbanner.png"
        alt="Welcome to LAX Membership"
      />

      <div class="content">

        <div class="text">
          Thank you for becoming a LAX member!
        </div>

        <div class="text">
          Unlimited affordable recovery starts now.
        </div>

        <a
          href="https://www.laxnlounge.com.au/book"
          class="button"
        >
          Book now!
        </a>

        <div class="benefits-title">
          Check out your <strong><em>benefits</em></strong>:
        </div>

        <div class="benefits">

          <div class="benefit-card">
            <img
              src="https://www.laxnlounge.com.au/emails/hydrationcupboard.png"
              alt="Hydration cupboard"
            />
            <h3>Hydration Cupboard</h3>
            <p>
              Use <strong>code 8888</strong> to access the electrolytes cupboard in the laundry.
            </p>
          </div>

          <div class="benefit-card">
            <img
              src="https://www.laxnlounge.com.au/emails/pausemembership.png"
              alt="Pausing your membership"
            />
            <h3>Pausing your membership</h3>
            <p>
              You can pause your membership in your profile tab when needed!
            </p>
          </div>

          <div class="benefit-card">
            <img
              src="https://www.laxnlounge.com.au/emails/unlimitedrecovery.png"
              alt="Unlimited recovery"
            />
            <h3>Unlimited Recovery</h3>
            <p>
              Book in as many times as you want!
            </p>
          </div>

        </div>

        <div class="text" style="margin-top: 32px;">
          We can’t wait to continue to support you and your recovery!
        </div>

        <a
          href="https://www.laxnlounge.com.au/book"
          class="button"
        >
          Book now!
        </a>

      </div>

      <div class="footer">
        <div class="divider"></div>

        88 Cook Street, Northgate, QLD

        <br /><br />

        © Lax N Lounge
      </div>

    </div>
  </div>
</body>
</html>
`;
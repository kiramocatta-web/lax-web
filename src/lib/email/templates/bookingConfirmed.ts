// src/lib/email/templates/bookingConfirmed.ts

import { br } from "node_modules/@fullcalendar/core/internal-common"

export const bookingConfirmedTemplate = `
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

    .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .booking-time {
      font-size: 20px;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .text {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 24px;
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
      margin-top: 8px;
      margin-bottom: 16px;
    }

    .footer {
      background-color: #323232;
      color: #ede9e2;
      text-align: center;
      padding: 32px 24px;
      font-size: 14px;
      line-height: 1.8;
    }

    .footer a {
      color: #ede9e2;
      text-decoration: underline;
    }

    .divider {
      width: 100%;
      height: 1px;
      background-color: #ede9e2;
      margin-bottom: 24px;
    }

    @media only screen and (max-width: 600px) {
      .title {
        font-size: 22px;
      }

      .booking-time,
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
        src="https://yjnzdwxqkhizfeypr6oqlfaw3txbalo0_alnw_olssa.canva-cdn.email/1f3923b73f33105971c230f8c837de4c.jpg"
        alt="Lax N Lounge"
      />

      <div class="content">

        <div class="title">
          See you soon, you amazing thing you!
        </div>

        <div class="booking-time">
          <strong>
         <div class="booking-time">
  <strong>{{BOOKING_DATE_FORMATTED}}</strong>
  <br />
  {{START_TIME}} – {{END_TIME}}
</div>

        <div class="text">
          Thank you for supporting LAX & supporting yourself with affordable recovery.
        </div>

        <div class="text">
          Want to...
        </div>

        <a
          href="https://www.laxnlounge.com.au/book"
          class="button"
        >
          Book Again?
        </a>

        <br />

        <a
          href="https://www.laxnlounge.com.au/profile"
          class="button"
        >
          Reschedule?
        </a>

        <div class="text" style="margin-top: 32px;">
          We can’t wait to continue to support you and your recovery!
        </div>

      </div>

      <div class="footer">

        <div class="divider"></div>

        88 Cook Street, Northgate, QLD

        <br /><br />

        <a href="https://www.laxnlounge.com.au/cancellation">
          Cancellation Policy
        </a>

        <br /><br />

        © Lax N Lounge

      </div>

    </div>

  </div>
</body>
</html>
`;


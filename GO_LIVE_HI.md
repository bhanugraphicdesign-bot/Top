# POWER WEB STUDIO AI — गो-लाइव गाइड (GO LIVE GUIDE IN HINDI)

**कंपनी:** भानु राम बरीहा डिजिटल टेक्नोलॉजीज (BHANU RAM BARIHA DIGITAL TECHNOLOGIES)  
**Firebase / GCP प्रोजेक्ट ID:** `turnkey-invention-70z9n`  
**Firestore डेटाबेस ID:** `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`

नीचे दिए गए 5 चरणों को क्रम से पूरा करने पर आपकी वेबसाइट Google Cloud Run पर सुरक्षित रूप से लाइव हो जाएगी।

---

## 1. Firebase में Authorized Domains जोड़ें (Google Login के लिए)

अगर आपका प्रोडक्शन डोमेन या Cloud Run URL Firebase में अधिकृत नहीं होगा, तो Google से लॉगिन करते समय `This domain is not yet authorized in Firebase.` संदेश दिखाई देगा।

1. [Firebase Console](https://console.firebase.google.com/) खोलें और प्रोजेक्ट **`turnkey-invention-70z9n`** चुनें।
2. बाएँ मेनू से **Build -> Authentication -> Settings -> Authorized domains** पर जाएं।
3. **Add domain** बटन दबाकर ये डोमेन जोड़ें:
   - आपका कस्टम डोमेन (जैसे `your-domain.com` और `www.your-domain.com`)
   - आपका Google Cloud Run सर्विस URL (जैसे `your-service-xxxx.a.run.app`, बिना `https://` के)
4. सेव करें।

---

## 2. Google Cloud Run Environment Variables और Secrets सेट करें

Cloud Run सर्विस को चलाने के लिए दो तरह के मान चाहिए — **Build Args / Env Vars** (सामान्य कॉन्फ़िगरेशन) और **Secret Manager Secrets** (गोपनीय कुंजियाँ)।

### A. पहले Google Secret Manager में गोपनीय कुंजियाँ सेव करें
1. Google Cloud Console -> **Security -> Secret Manager** खोलें।
2. ये Secrets बनाएं:
   - `payment-secret`: कम से कम 32 अक्षरों की रैंडम hex कुंजी (टर्मिनल में `openssl rand -hex 32` से बनाएं)।
   - `payment-webhook-secret` *(वैकल्पिक)*: अगर पेमेंट गेटवे वेबहुक उपयोग करते हैं, तो अलग 32+ अक्षरों की रैंडम कुंजी।
   - `gemini-api-key` *(वैकल्पिक)*: यदि सर्वर-साइड Gemini AI का उपयोग कर रहे हैं।

### B. Cloud Run Service में Environment Variables जोड़ें
Cloud Run -> अपनी सर्विस चुनें -> **Edit & deploy new revision -> Variables & Secrets**:

| वेरिएबल का नाम | कहाँ सेट करें | मान (Example / Value) | विवरण |
|---|---|---|---|
| `NODE_ENV` | Env Var | `production` | प्रोडक्शन मोड (सख्त CSP और बिल्ड फ़ाइलें) |
| `SITE_URL` | Docker Build Arg **और** Env Var | `https://your-domain.com` | बिना अंतिम `/` के; SEO canonical, `sitemap.xml` व CORS के लिए |
| `GCS_BUCKET` | Env Var | `<आपका-प्राइवेट-GCS-बकेट>` | केवल बकेट का नाम (बिना `gs://`); फ़ाइल अपलोड के लिए आवश्यक |
| `VITE_RECAPTCHA_SITE_KEY` | Docker Build Arg **और** Env Var | `<reCAPTCHA-v3-Site-Key>` | Firebase App Check से प्राप्त Site Key |
| `ENFORCE_APP_CHECK` | Env Var | पहले `false`, फिर `true` | `false` पर सर्वर **Monitor Mode** में रहता है (जाँच व लॉग करता है, पर अनुरोध नहीं रोकता); लाइव परीक्षण के बाद `true` करें |
| `STRICT_PRODUCTION_ENV` | Env Var | `true` | कोई भी आवश्यक प्रोडक्शन वेरिएबल छूटने पर कंटेनर को असुरक्षित रूप से चालू होने से रोकता है |
| `TRUST_PROXY_HOPS` | Env Var | `1` | Cloud Run प्रॉक्सी के लिए सही क्लाइंट IP रेट-लिमिटिंग |
| `CORS_ALLOWED_ORIGINS` | Env Var | `https://www.your-domain.com` | यदि एक से अधिक कस्टम डोमेन हैं (कॉमा से अलग करें) |
| `PAYMENT_SECRET` | **Secret** (`Secret Manager`) | `payment-secret:latest` | पेमेंट सुरक्षा हस्ताक्षर (कभी सामान्य Env Var में न डालें) |
| `GEMINI_API_KEY` | **Secret** (`Secret Manager`, वैकल्पिक) | `gemini-api-key:latest` | केवल सर्वर के लिए |

> **जरूरी नियम:** `SITE_URL` और `VITE_RECAPTCHA_SITE_KEY` को Docker इमेज बनाते समय `--build-arg` में भी पास करें ताकि वे ब्राउज़र बंडल में भी उपलब्ध रहें।

---

## 3. Cloud Run Service Account को Firestore (और Storage) IAM Role दें

अगर Cloud Run सर्विस अकाउंट के पास अनुमति नहीं होगी, तो `/api/health/ready` `503 FIRESTORE_PERMISSION_DENIED` देगा और फ़ॉर्म/इनवॉइस डेटाबेस में सेव नहीं होंगे।

1. पहले जानें कि आपका Firestore डेटाबेस किस लोकेशन में है और उसी रीजन में Cloud Run चलाएं:
   ```bash
   gcloud firestore databases describe \
     --database="ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897" \
     --project="turnkey-invention-70z9n" \
     --format="value(locationId)"
   ```
2. Google Cloud Console -> **IAM & Admin -> Service Accounts** में एक समर्पित Service Account बनाएं (जैसे `pws-cloudrun-sa@turnkey-invention-70z9n.iam.gserviceaccount.com`) और इसे Cloud Run सर्विस की **Security** सेटिंग में चुनें।
3. **IAM** में इस Service Account को ये न्यूनतम जरूरी Roles दें:
   - **Cloud Datastore User** (`roles/datastore.user`) — पूरे प्रोजेक्ट `turnkey-invention-70z9n` पर (ताकि `firebase-admin` Firestore पढ़ और लिख सके)।
   - **Storage Object Admin** (`roles/storage.objectAdmin`) — केवल आपके प्राइवेट `<GCS_BUCKET>` बकेट पर।
   - **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`) — केवल अपने ही Service Account पर (यदि signed download URL उपयोग करें)।
   - **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`) — केवल ऊपर बनाए गए Secrets पर।
4. इसके बाद `GET /api/health/ready` खोलकर जांचें — यह `HTTP 200` और `{"ready":true}` दिखाना चाहिए।
5. अपनी `firestore.rules` और `firestore.indexes.json` को लाइव डेटाबेस पर डिप्लॉय करें:
   ```bash
   firebase deploy --only firestore --project turnkey-invention-70z9n
   ```

---

## 4. पहला Admin यूज़र कैसे बनाएं

सुरक्षा कारणों से कोड में कोई हार्डकोडेड एडमिन ईमेल नहीं है। पहला Admin बनाने के लिए:

1. सबसे पहले अपनी लाइव वेबसाइट पर जाकर **सामान्य यूज़र की तरह Google या Email से एक बार लॉगिन करें** ताकि आपका खाता Firebase Auth में बन जाए।
2. अपने स्थानीय कंप्यूटर या Cloud Shell से (जहाँ `turnkey-invention-70z9n` पर Admin अनुमति हो) नीचे दिया गया कमांड चलाएं (`ADMIN_EMAIL` में अपना ईमेल लिखें):
   ```bash
   ADMIN_EMAIL=ssbhanu41@gmail.com npx tsx scripts/create-admin.ts
   ```
3. यह स्क्रिप्ट दो काम अपने आप करेगी:
   - Firebase Auth में Custom Claim `{ admin: true, role: "admin" }` सेट करेगी।
   - Firestore डेटाबेस `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897` के `user_roles/{uid}` दस्तावेज़ में `role: "admin"` लिखेगी।
4. अब वेबसाइट पर एक बार **Log Out** करके दोबारा **Sign In** करें (ताकि नया Admin टोकन रीफ़्रेश हो जाए) और `/admin-dashboard` खोलें।

---

## 5. Google Search Console में वेबसाइट जोड़ें और Sitemap सबमिट करें

1. [Google Search Console](https://search.google.com/search-console) खोलें और **Add Property** पर क्लिक करें।
2. **URL prefix** (जैसे `https://your-domain.com`) या **Domain** चुनें और **Continue** दबाएं।
3. **DNS TXT रिकॉर्ड** (Domain के लिए) या **HTML File / Meta Tag** से स्वामित्व सत्यापित करें।
4. बाएँ मेनू से **Sitemaps** पर जाएं -> `sitemap.xml` लिखें -> **Submit** पर क्लिक करें।  
   *(वेबसाइट पर `/robots.txt` और `/sitemap.xml` अपने आप लाइव `SITE_URL` के साथ तैयार होकर सर्व होते हैं।)*
5. कुछ प्रमुख पृष्ठों (`/`, `/services`, `/android-portfolio`, `/ai-solutions`, `/about`) को **URL Inspection -> Request Indexing** से जांचें ताकि पुष्टि हो कि हर पृष्ठ का अपना `<title>`, `meta description`, `canonical` और `og:url` सही दिख रहा है, और किसी अमान्य URL पर सर्वर `HTTP 404` दे रहा है।

// AUTO-GENERATED — run once: node scripts/import-products.js
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const CATEGORIES = {
  "الزيوت الطبيعيه": "da359ca8-5643-4c05-86a4-83711fc42d49",
  "العروض": "1ea23131-c400-46dc-a060-f021d9fb0bec",
  "الا كثر مبيعا": "db791f21-8e61-44c8-bbe3-4b2b9f9d4f18",
  "العنايه بالشعر": "9e0180ab-dba3-4abb-ae68-49e9bdabcc07",
  "منتجات اخري": "98761776-03bf-40ac-bfdb-af483fc09c80",
  "زيت الزيتون": "077a454b-1f18-46bb-b92c-d505d9c4acdf",
  "العنايه بالبشره": "20e04c84-53a9-47a7-8c67-253c50d74e84",
  "منتجات عنايه بالبشره والشعر": "f9fcac10-cd08-485f-8dfd-a338a34cadd2",
  "التمر": "7050c53a-5c2b-4460-9ca0-848de7199933",
  "رمضان": "1380be2f-4548-4f8d-931c-346ddda15180",
  "الطحينه": "667398e3-7fc7-4115-b802-0413762a9940",
  "مجموعات": "e6d81e9a-cd46-449f-acc2-edf6a6f14ff8",
  "مخللات": "fedd6eae-226c-414f-8e43-aef9cc551017",
  "خل التفاح": "5c339136-8b3d-4b40-b16f-370286b919d5"
};
const PRODUCTS = [
  {
    "id": "6277739a-7ba4-4eb7-ad7d-89c7424433f3",
    "name_ar": "تركيبه السبع زيوت",
    "description_ar": "<p><strong>تركيبه السبع زيوت للشعر و البشره لمنع تساقط الشعر وزياده كثافه الشعر 60 مل</strong></p>\n<p><strong>تركيبه مكونه من (زيت الزيتون و زيت الروزماري والجرجير واللوز الحلو وجوز الهند والجوجبا و السمسم)</strong></p>",
    "price": 120.0,
    "old_price": 130.0,
    "main_image": "https://assets.wuiltstore.com/cm5qva2d901s601n3ahjz1bh2_IMG_5417.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العروض",
      "الا كثر مبيعا",
      "العنايه بالشعر"
    ],
    "variants": []
  },
  {
    "id": "0e4a89d5-7586-43e2-b1a9-51276fab06a1",
    "name_ar": "زيت الروزماري الطبيعي",
    "description_ar": "<p><strong>زيت روزماري خام للشعريلزم تخفيفه بزيت ناقل وزن 60 مل&nbsp;</strong></p>",
    "price": 110.0,
    "old_price": 250.0,
    "main_image": "https://assets.wuiltstore.com/cm8frzvgw173701nlh0n1b4jk_photo_5967826954822468743_y.jpg",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر"
    ],
    "variants": []
  },
  {
    "id": "b96328e9-0690-4ce1-a59a-a29d0f0e5dc5",
    "name_ar": "دبس تمر",
    "description_ar": "<p><strong>دبس تمر طبيعي</strong></p>\n<p><strong>وزن 800 جرام</strong></p>",
    "price": 120.0,
    "old_price": 125.0,
    "main_image": "https://assets.wuiltstore.com/cm5xm2miy056z01n35d97g5tz_IMG_5530.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "منتجات اخري"
    ],
    "variants": []
  },
  {
    "id": "139dcce0-e556-40b6-adc2-a4e273012ed2",
    "name_ar": "زيت حبه البركه العضوي 60مل",
    "description_ar": "<p><strong>يساعد زيت حبه البركه العضوي علي تحسن صحه البشرة وتحسين صحه الجهاز الدوري وتنظيم ضربات القلب ويساعد في خسارة الوزن الزائد وتحسين صحه الكبد وتحسين الشعر</strong></p>",
    "price": 85.0,
    "old_price": 130.0,
    "main_image": "https://assets.wuiltstore.com/cm5qup60d01rz01n31obfcyen_IMG_5421.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "d1ba658f-b0a5-49e7-97a3-94dcb1dfd206",
    "name_ar": "زيت سمسم خام",
    "description_ar": "<p><strong>&nbsp;زيت سمسم خام عضوي للشعر والبشره والعلاج يساعد في تعزيز صحه الاسنان واللسة ويساعد في تعزيز صحه القلب والاوعية الدموية وتعزيز صحة الجهاز الهضمي</strong></p>",
    "price": 80.0,
    "old_price": 100.0,
    "main_image": "https://assets.wuiltstore.com/cm5quuv0y01s201n33ljvfbbd_IMG_5422.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "40fdba43-07cc-488d-afca-31ed82914b82",
    "name_ar": "زيت جوجوبا 60 مل",
    "description_ar": "<p><strong>زيت الجوجبا&nbsp; يمكن أن تساعد خصائصه المغذية والوقائية على تهدئة وإصلاح البشرة الجافة أو التالفة أو المتهيجة، بالإضافة إلى تعزيز مرونة البشرة وتقليل ظهور الخطوط الدقيقة والتجاعيد. يمكن أن تساعد فوائده المرطبة والمرطبة أيضًا على تقوية وتنعيم الشعر وتقليل التجعد ومنع تقصف الأطراف. يأتي زيت الجوجوبا الخاص بنا في زجاجة زجاجية داكنة.</strong></p>",
    "price": 110.0,
    "old_price": 180.0,
    "main_image": "https://assets.wuiltstore.com/cm5qutfxr01s101n33x4xcn98_IMG_5420.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "زيت الزيتون",
      "العنايه بالبشره"
    ],
    "variants": []
  },
  {
    "id": "4a62eaed-f08a-4044-9365-3d0da0fefc1f",
    "name_ar": "عسل برسيم وزن كيلو",
    "description_ar": "",
    "price": 300.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cmeibyj4g3wni01kscrp3bstz_Untitled_design.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الا كثر مبيعا",
      "منتجات اخري"
    ],
    "variants": []
  },
  {
    "id": "d601e2ef-7119-427c-9188-f2b7a0583d3b",
    "name_ar": "عسل برسيم نصف كيلو",
    "description_ar": "<p><strong>عسل برسيم طبيعي بدون اي تغذيه او اي اضافات</strong></p>",
    "price": 160.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cmky0qfo10yib01gnf4457jc2_cmeibyj4g3wni01kscrp3bstz_Untitled_design.webp",
    "stock": 100,
    "is_active": true,
    "collections": [
      "منتجات اخري"
    ],
    "variants": []
  },
  {
    "id": "441a87c0-5a1b-4d9e-8b38-a488957a071b",
    "name_ar": "زيت بذر كتان عضوي",
    "description_ar": "<p><strong>&nbsp;زيت بذر الكتان العضوي او ما يسمي بالزيت الحار 125 مل</strong>&nbsp;<strong>ويساعد في امداد الجسم ب اوميجا 3 تقليل نمو الخلايا السرطانية وتعزيز صحة القلب</strong></p>",
    "price": 70.0,
    "old_price": 150.0,
    "main_image": "https://assets.wuiltstore.com/cm5qus44s01s001n3296d5mwr_IMG_5418.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "4c87b81f-0d7d-4565-852c-f8afd17919c0",
    "name_ar": "لتر زيت زيتون بكر ممتاز زجاج",
    "description_ar": "<p style=\"text-align: center;\"><strong>يساعد في علاج العديد من الامراض مثل ارتفاع الكلوسترول والامساك والوقايه من امراض القلب</strong></p>\n<p style=\"text-align: center;\"><strong>لتر زيت زيتون&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون مطروح اوليفي مش زي اي زيت انت اشتريته من بره زيت زيتون علاجي باقل نسبه حموضه ومستعد للتحليل في اي معمل في مصر&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>حموضه اقل من 1% تقريبا من 0.5-0.8&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون يستخدم للعلاج او للطبخ او للشعر&nbsp;</strong></p>",
    "price": 540.0,
    "old_price": 600.0,
    "main_image": "https://assets.wuiltstore.com/cm5tjha9g02zv01n3dlzndqkt_IMG_5471.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العروض",
      "الا كثر مبيعا",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "31bba173-3bb1-4a0f-9688-40b184a9ce88",
    "name_ar": "ربع لتر زيت زيتون بكر ممتاز",
    "description_ar": "<p style=\"text-align: center;\"><strong>يساعد في علاج العديد من الامراض مثل ارتفاع الكلوسترول والامساك والوقايه من امراض القلب</strong></p>\n<p style=\"text-align: center;\"><strong>ربع لتر زيت زيتون</strong></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون مطروح اوليفي مش زي اي زيت انت اشتريته من بره زيت زيتون علاجي باقل نسبه حموضه ومستعد للتحليل في اي معمل في مصر&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>حموضه اقل من 1% تقريبا من 0.5-0.8&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون يستخدم للعلاج او للطبخ او للشع</strong></p>",
    "price": 150.0,
    "old_price": 170.0,
    "main_image": "https://assets.wuiltstore.com/cm5vlb4h004bh01n33b9r5gx4_IMG_5506.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العروض",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "0322ac29-cea3-4676-9f95-069f9477c9eb",
    "name_ar": "نصف لتر زيت زيتون بكر ممتاز",
    "description_ar": "<p style=\"text-align: center;\"><span style=\"color: rgb(241, 196, 15);\"><strong>يساعد في علاج العديد من الامراض مثل ارتفاع الكلوسترول والامساك والوقايه من امراض القلب</strong></span></p>\n<p style=\"text-align: center;\"><span style=\"color: rgb(224, 62, 45);\"><strong>نصف لتر زيت زيتون</strong></span></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون مطروح اوليفي مش زي اي زيت انت اشتريته من بره زيت زيتون علاجي باقل نسبه حموضه ومستعد للتحليل في اي معمل في مصر&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>حموضه اقل من 1% تقريبا من 0.5-0.8&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون يستخدم للعلاج او للطبخ او للشع</strong></p>",
    "price": 275.0,
    "old_price": 300.0,
    "main_image": "https://assets.wuiltstore.com/cm5vl9vch04bf01n31bns530x_IMG_5507.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العروض",
      "الا كثر مبيعا",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "5bf6c005-cd25-49e9-934a-f5120e91095f",
    "name_ar": "لتر زيت زيتون بكر ممتاز صفيح",
    "description_ar": "<p>&nbsp;</p>\n<p>&nbsp;</p>\n<p style=\"text-align: center;\"><strong>يساعد في علاج العديد من الامراض مثل ارتفاع الكلوسترول والامساك والوقايه من امراض القلب</strong></p>\n<p style=\"text-align: center;\"><strong>لتر زيت زيتون&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون مطروح اوليفي مش زي اي زيت انت اشتريته من بره زيت زيتون علاجي باقل نسبه حموضه ومستعد للتحليل في اي معمل في مصر&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>حموضه اقل من 1% تقريبا من 0.5-0.8&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>زيت زيتون يستخدم للعلاج او للطبخ او للشع</strong></p>",
    "price": 550.0,
    "old_price": 600.0,
    "main_image": "https://assets.wuiltstore.com/cm5tl50xg031e01n306q8a8kr_IMG_5472.png",
    "stock": 0,
    "is_active": false,
    "collections": [
      "العروض",
      "الا كثر مبيعا",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "bddf813a-240a-4cf2-876f-b530aa682ad4",
    "name_ar": "صابون زبده الشيا 100 جرام (خليه)",
    "description_ar": "<p><strong>يستخدم للبشره الجافه ويعطيها ترطيب ويزيل اثار الحبوب نتيجه التقدم في السن ويزيل الترهلات اسفل العين</strong></p>",
    "price": 60.0,
    "old_price": 70.0,
    "main_image": "https://assets.wuiltstore.com/cm7uin6u50vci01nlge9v9bmd__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__6_.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "1ce1d450-5f35-4c9d-86b7-eb1101d831c2",
    "name_ar": "تمر الوادي نصف رطب",
    "description_ar": "<p><strong>وزن العلبه ٧٠٠ جرام تقريبا</strong></p>",
    "price": 45.0,
    "old_price": 75.0,
    "main_image": "https://assets.wuiltstore.com/cm7bph1fm0j3401nlbyz4fge3__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86.zip_-_1.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "منتجات اخري",
      "التمر",
      "رمضان"
    ],
    "variants": []
  },
  {
    "id": "d6939ce0-20a6-4a49-a206-d910e53e37db",
    "name_ar": "صابون اوليفي للشعر بالغار",
    "description_ar": "<p><strong>&nbsp;</strong><strong>صابون اوليفي للشعر بالغار</strong></p>\n<p><strong>تستخدم للشعر والبشره يغذي فروه الرأس ويمنع التساقط ويعالج فروه الرأس من الحكه والفطريات&nbsp;</strong></p>",
    "price": 70.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7ujn3wt0vdg01nl01bf43gq__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__10_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "3a756b93-39d8-4b85-995e-47356b25bbcb",
    "name_ar": "صابون اوليفي للشعر بالقرنفل 170 جرام",
    "description_ar": "<p><strong>صابون طبيعي للشعر</strong></p>\n<p>&nbsp;</p>",
    "price": 70.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7ujkb940vd501nl4bs7e9fq__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__14_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "aac5d84f-2c79-4f3d-8c79-7e5b537b6d73",
    "name_ar": "دقه زعتر سوري ٢٥٠ جم",
    "description_ar": "<p>دقه زعتر سورية، مفيده للقلب والاوعيه الدموية</p>",
    "price": 40.0,
    "old_price": 50.0,
    "main_image": "https://assets.wuiltstore.com/cm62lxp3b07v801n37mk67hbl_48eaeaa2-d4f4-4277-836d-2fce0aa8541a.jpeg",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الا كثر مبيعا",
      "منتجات اخري",
      "رمضان"
    ],
    "variants": []
  },
  {
    "id": "9a2f9dda-fd7c-4e2f-bfe3-e662f8c52272",
    "name_ar": "طحينه سمسم خام وزن 1000جرام",
    "description_ar": "<p>&nbsp;</p>\n<p style=\"text-align: center;\"><strong>طحينه سمسم خام صحيه</strong></p>\n<p style=\"text-align: center;\"><strong>وزن 1000جرام</strong></p>",
    "price": 210.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5xm19v4056y01n3cblvewlf_IMG_5532.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الا كثر مبيعا",
      "منتجات اخري",
      "رمضان",
      "الطحينه"
    ],
    "variants": []
  },
  {
    "id": "9d99a640-8b82-46a9-bb97-70eff0364bfc",
    "name_ar": "صابون النيله الزرقا 100 جرام (خليه)",
    "description_ar": "<p><strong>يساعد في التخلص من الجلد الميت وتنظيف المسام من بقايا الشوائب والمكياج</strong></p>\n<p><strong>طريقه الاستخدام</strong></p>\n<p><strong>يغسل الوجه بالمياه الدافيه وثم يغسل بالصابون ويترك من دقيقتين لتلاته علي البشره</strong></p>",
    "price": 60.0,
    "old_price": 70.0,
    "main_image": "https://assets.wuiltstore.com/cm7uhv4yz0vbo01nl69qjcdu5__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__1_.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "0cefea9e-1b69-4a97-85c4-234a8a80f404",
    "name_ar": "صابون فحم طبيعي 100 جرام (خليه)",
    "description_ar": "<p><strong>صابون فحم طبيعي يستخدم للبشره الدهنيه ويزيل حبوب الشباب ويساعد في ازاله الرؤوس السوداء&nbsp;</strong></p>\n<p><strong>طريقه استخدامها يتم غسل الوجه بمياء سخنه وغسل الوجه بالصابون وتركه علي الوجه لمده ٣ دقايق</strong></p>",
    "price": 60.0,
    "old_price": 70.0,
    "main_image": "https://assets.wuiltstore.com/cm7uhtik00vbk01nle59o7b03__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__3_.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "cbaf586f-28e4-4490-b9fc-dea0ce829e7f",
    "name_ar": "سيرم العرقسوس",
    "description_ar": "<p style=\"text-align: center;\"><strong>سيرم العرقسوس يساعد علي علاج التهابات البشره</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;وتفتيح البشره وتقشير الجلد الميت </strong></p>\n<p style=\"text-align: center;\"><strong>واعاده اللون الطبيعي للبشره</strong></p>",
    "price": 180.0,
    "old_price": 215.0,
    "main_image": "https://assets.wuiltstore.com/cmeyu3l814uvm01ksbkfqfsnc_WhatsApp_Image_2025-08-30_at_2.11.09_AM.jpeg",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "201efbc3-8444-4a40-9db5-882013f8d85e",
    "name_ar": "سيرم الهيلارونيك",
    "description_ar": "<p style=\"text-align: center;\"><strong>يساعد في اعطاء حيويه للبشره</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;كما انه يساعد علي ترطيب البشره وازاله الحبوب</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;وتقليل ظهور التجاعيد وشد الجلد</strong></p>",
    "price": 180.0,
    "old_price": 215.0,
    "main_image": "https://assets.wuiltstore.com/cmeyu5xuc4uvt01ks9yczd4ph_WhatsApp_Image_2025-08-30_at_2.11.09_AM__1_.jpeg",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "c3a2db6b-87f9-45ca-980f-f6d25d88d1e4",
    "name_ar": "مجموعه العنايه بالشعر من مطروح اوليفي بخصم 30% علي المجموعه",
    "description_ar": "<p style=\"text-align: center;\"><strong>تتكون من&nbsp; وشامبو وسيرم زيت زيتون وروزماري وتركيبه القرنفل وهيرمست معطر للشعر&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>فوايدها</strong></p>\n<p style=\"text-align: center;\"><strong>تساعد في علاج الصلع الوراثي بسبب الروزماري تساعد في تنظيف وتطهير فروه الرأس تساعد في تنعيم وتكثيف الشعر وترميم الشعر التالف والمتساقط</strong></p>",
    "price": 600.0,
    "old_price": 865.0,
    "main_image": "https://assets.wuiltstore.com/cmid9g1g3084o01kqfgxf2n8p_Orange_and_White_Modern_Hair_Serum_Offer_Gift_Certificate__2___1_.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "العنايه بالشعر",
      "مجموعات"
    ],
    "variants": []
  },
  {
    "id": "8115e641-f871-430d-830b-77c9f384fd28",
    "name_ar": "مجموعه مطروح اوليفي للبشره خصم 30% علي المجموعه",
    "description_ar": "<p style=\"text-align: center;\"><strong>مجموعه مكونه من (بادي لوشن او سبلاش - صابونه من اختيارك - جل صبار - سكراب- سيرم من اختيارك- مخمريه)</strong></p>\n<p style=\"text-align: center;\"><strong>فوايدها ترطيب عالي جدا للبشره مع رائحه خفيفه تطهير البشره من اثار الشمس والحبوب والبذور السوداء</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;تقشير الجلد الميت والمحروق من الشمس اعطاء نظره صافيه للبشره وملمس نامع</strong></p>",
    "price": 480.0,
    "old_price": 685.0,
    "main_image": "https://assets.wuiltstore.com/cmid9detp084c01kq2lzkefzi_Orange_and_White_Modern_Hair_Serum_Offer_Gift_Certificate__1___1_.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "العنايه بالبشره",
      "مجموعات"
    ],
    "variants": []
  },
  {
    "id": "4a45d5d9-1c48-4c8b-b24b-dccfa6d0626c",
    "name_ar": "صابون جوز هند طبيعي 100 جرام (خليه)",
    "description_ar": "<p><strong>يساعد في ترطيب وتبيض البشره واعطائها نضاره</strong></p>\n<p><strong>طريقه استخدامها</strong></p>\n<p><strong>يغسل الوجه بمياه دافيه ويغسل الوجه بصابون لمده ٣ دقايق</strong></p>",
    "price": 60.0,
    "old_price": 70.0,
    "main_image": "https://assets.wuiltstore.com/cm7uiii360vce01nl41gacpg2__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__5_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "215c29ab-e548-49c6-96aa-85003d45f8a2",
    "name_ar": "صابون لبان الذكر والعسل 100 جم (خليه)",
    "description_ar": "<p><strong>صابون لبان الذكر والعسل لمحاربه الشيخوخه وشد البشره&nbsp;</strong></p>\n<p><strong>طريقه الاستخدام</strong></p>\n<p><strong>يغسل الوجه بالمياه الدافيه وثم يغسل بالصابون ويترك من دقيقتين لتلاته علي البشره</strong></p>",
    "price": 60.0,
    "old_price": 70.0,
    "main_image": "https://assets.wuiltstore.com/cm7uiewvu0vc901nlho8rhrhz__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__4_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "db86bb4e-fd00-4bee-bf08-6e4b864bef5d",
    "name_ar": "شامبو زيت زيتون والافوكادو",
    "description_ar": "",
    "price": 150.0,
    "old_price": 185.0,
    "main_image": "https://assets.wuiltstore.com/cmfwwatvk0nib01hn1opb6x65__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__9_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر"
    ],
    "variants": []
  },
  {
    "id": "37ab2ed4-de52-478c-aee7-5a6f22bb60ed",
    "name_ar": "شامبو طبيعي زيت زيتون واللافندر",
    "description_ar": "<p style=\"text-align: center;\"><strong>شامبو طبيعي للشعر يستخدم لترطيب الشعر</strong></p>\n<p style=\"text-align: center;\"><strong> يعزز نمو الشعر من الجذور حتي الاطراف ويعالج مشاكل التقصف ويترك رائحه جميله</strong></p>\n<p style=\"text-align: center;\"><strong> ويمنع الهيشان ويزيل القشره ويرمم الشعر التالف&nbsp;</strong></p>",
    "price": 150.0,
    "old_price": 185.0,
    "main_image": "https://assets.wuiltstore.com/cmezpzpf34w3n01kseaja76z3__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__4_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "805e609c-2a77-4754-a162-005124624971",
    "name_ar": "شامبو طبيعي زيت زيتون وقرنفل",
    "description_ar": "<p style=\"text-align: center;\"><strong>&nbsp;يطهر ويعالج فروه الرأس من الحبوب والقشره</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;ويمنع تقصف الشعر والهيشان </strong></p>\n<p style=\"text-align: center;\"><strong>ويقوي بويصله الشعر ويرمم الشعر التالف</strong></p>",
    "price": 150.0,
    "old_price": 185.0,
    "main_image": "https://assets.wuiltstore.com/cmezpyr5t4w3k01kseu9o6bid__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__5_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "0ed16ae3-4f29-47f7-abc1-62cb317269a8",
    "name_ar": "شامبو طبيعي بالروزماري",
    "description_ar": "<div id=\"description\" class=\"sc-67adf945-0 bKIQyu\">\n<div class=\"sc-67adf945-1 kvtGgy\">\n<div class=\"sc-b73ea47a-0 hdQrUD\">\n<div class=\"sc-b73ea47a-1 kPnEcI\">\n<div class=\"sc-5a6673a0-0 iAwKec sc-b73ea47a-4 hedykt\">\n<p style=\"text-align: center;\"><strong>شامبو طبيعي للشعر يستخدم لجميع انواع الشعر</strong></p>\n<p style=\"text-align: center;\"><strong>يعزز نمو الشعر من الجذور حتي الاطراف ويعالج مشاكل القمل ويترك رائحه جميله</strong></p>\n<p style=\"text-align: center;\"><strong> ويمنع الهيشان ويزيل القشره ويرمم الشعر التالف&nbsp;</strong></p>\n</div>\n</div>\n</div>\n</div>\n</div>\n<div class=\"sc-1649e757-0 dURAyI\">\n<div class=\"sc-1649e757-0 bgNZCS border-b border-b-gray-200 pb-sm\">&nbsp;</div>\n</div>",
    "price": 150.0,
    "old_price": 185.0,
    "main_image": "https://assets.wuiltstore.com/cmezpx0u64w3c01ksg1t99s5o__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__6_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "24ffc497-12e0-4eac-932c-c8301d7a2e76",
    "name_ar": "بلسم من مطروح اوليفي",
    "description_ar": "<p><strong>بلسم طبيعي بالنعاع وافوكادو للعنايه اليوميه بالشعر</strong></p>",
    "price": 150.0,
    "old_price": 185.0,
    "main_image": "https://assets.wuiltstore.com/cmfwwbzaj0nii01hn9xvab3v4__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__8_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر"
    ],
    "variants": []
  },
  {
    "id": "048d91d5-c182-45f5-b882-c841c358b742",
    "name_ar": "تركيبه زيت النخاع",
    "description_ar": "<p style=\"text-align: center;\"><strong>التركيبه دي علاج شعرك لو انت عندك تقصف او هيشان او شعرك فيه تموج </strong></p>\n<p style=\"text-align: center;\"><strong>وبيتساقط بكميه كبيره ويساعد علي تغذيه الشعر&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>تركيبه النخاع مع 9 زيوت اخري مثل الروزماري وزيت الزيتون وزيت السمسم وزيت الجرجير وزيت ديل الحصان وشمع العسل</strong></p>",
    "price": 220.0,
    "old_price": 265.0,
    "main_image": "https://assets.wuiltstore.com/cmezrjzgx4w8501ksgzkmczg6__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__7_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "3ba7fdba-edd4-40c3-8a5f-43a46ffefbce",
    "name_ar": "سيرم الكلاجين",
    "description_ar": "<p style=\"text-align: center;\"><strong>سيرم الكلاجين علاج للتجاعيد وشد البشره</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;كما انه يساعد علي سحب الدهون والماء من الوجه لانه يحتوي علي زيت القهوه</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;واعطاء نضاره للبشره لانه يحتوي علي لبان الدكر ويستعمل مره يوميا</strong></p>",
    "price": 180.0,
    "old_price": 215.0,
    "main_image": "https://assets.wuiltstore.com/cmeyu0pmt4uvh01ks7ocb29ga_WhatsApp_Image_2025-08-30_at_2.11.08_AM.jpeg",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "a02ab094-e676-47ba-9efb-e9d9d487c073",
    "name_ar": "صابون كركم وعسل 100 جرام (خليه)",
    "description_ar": "<p><strong>يساعد في علاج النمش والكلف والصدفيه والاكزيما والتصبغات وحروق الشمس وترميم الجلد</strong></p>\n<p><strong>طريقه الاستخدام</strong></p>\n<p><strong>يغسل الوجه بالمياه الدافيه وثم يغسل بالصابون ويترك من دقيقتين لتلاته علي البشره</strong></p>",
    "price": 60.0,
    "old_price": 70.0,
    "main_image": "https://assets.wuiltstore.com/cm7uhtxct0vbl01nlhw5hdl3s__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__2_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "f5a2af82-a1ba-4601-9269-246d3d65bb70",
    "name_ar": "سيرم زيت الزيتون مع القرنفل",
    "description_ar": "<p style=\"text-align: center;\"><strong>العلاج الاول لتساقط الشعر خصوصا الشعر الدهني وعلاج القشره الدهنيه&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>كما يساعد علي تكثيف الشعر وملء الفراغات بشكل اسرع</strong></p>\n<p style=\"text-align: center;\"><strong>سيرم زيت الزيتون والقرنفل اضافه الي 8 زيوت اخري مثل السمسم والجرجير والخس وبعض الفيتامينات التي تغذي الشعر وتساعد علي نموه بشكل اسرع</strong></p>\n<p>&nbsp;</p>",
    "price": 180.0,
    "old_price": 215.0,
    "main_image": "https://assets.wuiltstore.com/cmeytq1v74uuw01ks104q4yf6__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__3_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "5131b50c-4e45-417f-916b-ec5a2d40be71",
    "name_ar": "سيرم زيت الزيتون والروزماري",
    "description_ar": "<p style=\"text-align: center;\"><strong>&nbsp;العلاج الاول لتساقط الشعر ويساعد علي علاج الصلع الوراثي&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>كما يساعد علي تكثيف الشعر وملء الفراغات بشكل اسرع</strong></p>\n<p style=\"text-align: center;\"><strong>سيرم زيت الزيتون والروزماري اضافه الي 8 زيوت اخري مثل السمسم والجرجير والخس وبعض الفيتامينات التي تغذي الشعر وتساعد علي نموه بشكل اسرع</strong></p>\n<p>&nbsp;</p>",
    "price": 180.0,
    "old_price": 215.0,
    "main_image": "https://assets.wuiltstore.com/cmeytwe1u4uva01ksbox50ojk__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__2_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "0c255e56-bb9e-4179-bb30-c1111c2aaa56",
    "name_ar": "جل اوليفرا",
    "description_ar": "<p><strong>جل الالوفيرا الطبيعي مرطب ومهدئ للبشره من حروق والتهابات الشمس</strong></p>",
    "price": 100.0,
    "old_price": 120.0,
    "main_image": "https://assets.wuiltstore.com/cmeprnixa4c3001ksdms850dp_f30e4572-22b1-470e-9477-3df32d6ddc10.jpeg",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الا كثر مبيعا",
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "17add851-f25a-4b67-984e-61c0dddf2b83",
    "name_ar": "عرض اتنين نص لتر",
    "description_ar": "",
    "price": 500.0,
    "old_price": 620.0,
    "main_image": "https://assets.wuiltstore.com/cmikbcey101p101kq57egapsi__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__11_.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "زيت الزيتون",
      "مجموعات"
    ],
    "variants": []
  },
  {
    "id": "77483da2-e0c5-40a5-9169-657a8dd0b471",
    "name_ar": "زيتون تفاحي",
    "description_ar": "<p><strong>زيتون تفاحي كيلو</strong></p>",
    "price": 130.0,
    "old_price": 140.0,
    "main_image": "https://assets.wuiltstore.com/cmcc0wog10fg001le29hchrdk__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "مخللات"
    ],
    "variants": []
  },
  {
    "id": "3b6ac8bf-eec0-4bda-b962-101ad0cd624f",
    "name_ar": "زيتون دولسي اخضر فاخر بلاستيك",
    "description_ar": "<p><strong>زيتون دولسي اخضر في برطمان بلاستيك ٧٠٠ جرام</strong></p>",
    "price": 85.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7blfptb0j0b01nlfnzs4ek8_Untitled_design.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "مخللات"
    ],
    "variants": []
  },
  {
    "id": "e54564c7-f8fe-408e-897b-2f22b4051525",
    "name_ar": "زيتون كلامتا يوناني",
    "description_ar": "<p><strong>زيتون كلامتا يوناني وزن 800 جرام تقريبا</strong></p>",
    "price": 120.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5uf57m203d701n30dh30v9p_IMG_5478.png",
    "stock": 100,
    "is_active": false,
    "collections": [
      "مخللات"
    ],
    "variants": []
  },
  {
    "id": "5a66abca-302d-47bd-bd58-01fee1c4abd5",
    "name_ar": "بادي اسبلاش مطروح اوليفي",
    "description_ar": "<p><strong>بادي اسبلاش ب ٥ روائح تدوم فعاليته لمده اكثر من ١٢ ساعه</strong></p>\n<p><strong>برجاء اختيار الرائحه اثناء شراء المنتج</strong></p>",
    "price": 165.0,
    "old_price": 185.0,
    "main_image": "https://assets.wuiltstore.com/cmeiamx9x3wkx01ksgcjt54kv_IMG_1671.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": [
      {
        "id": "67538959-e4c7-4f39-b993-0e569729a7a5",
        "option_name": "الرائحه",
        "option_value": "loly",
        "sku": "",
        "quantity": 100,
        "price_override": 165.0
      },
      {
        "id": "4aec5e17-8319-45e7-bba6-0d65a16af8ba",
        "option_name": "الرائحه",
        "option_value": "areej",
        "sku": "",
        "quantity": 100,
        "price_override": 165.0
      },
      {
        "id": "d5668bce-44e0-4a63-8e65-2488bfac3684",
        "option_name": "الرائحه",
        "option_value": "jana",
        "sku": "",
        "quantity": 100,
        "price_override": 150.0
      },
      {
        "id": "a84b73df-b412-4556-9eef-84d3cd6ded24",
        "option_name": "الرائحه",
        "option_value": "naseem",
        "sku": "",
        "quantity": 100,
        "price_override": 165.0
      },
      {
        "id": "d0c89615-8e35-4901-8242-e0b0f9999d34",
        "option_name": "الرائحه",
        "option_value": "rehana",
        "sku": "",
        "quantity": 100,
        "price_override": 165.0
      }
    ]
  },
  {
    "id": "28972443-224a-4346-92ed-95d19432770b",
    "name_ar": "هيرميست من مطروح اوليفي",
    "description_ar": "",
    "price": 220.0,
    "old_price": 240.0,
    "main_image": "https://assets.wuiltstore.com/cmfwwfivv0nim01hn37acc3i7_WhatsApp_Image_2025-09-22_at_11.56.47_PM.jpeg",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالشعر"
    ],
    "variants": [
      {
        "id": "ff440c13-4fb5-4ac6-8a57-61a3991d457f",
        "option_name": "الرائحه",
        "option_value": "loly(عطر عصري نسائي يترك بصمه هادئه مناسب للنهار)",
        "sku": "",
        "quantity": 100,
        "price_override": 220.0
      },
      {
        "id": "517ddef5-556d-42c0-bf9f-b1ca1dadf81a",
        "option_name": "الرائحه",
        "option_value": "jana(عطر رجالي قوي برائحه العود)",
        "sku": "",
        "quantity": 100,
        "price_override": 220.0
      },
      {
        "id": "fa5464ab-b789-4a4e-8f10-3d346967d33c",
        "option_name": "الرائحه",
        "option_value": "naseem(عطر ناعم وخفيف للجنسين)",
        "sku": "",
        "quantity": 0,
        "price_override": null
      },
      {
        "id": "eb84e437-6728-4da4-a54f-0936ab15e736",
        "option_name": "الرائحه",
        "option_value": "arrej(مزيج من روايح الورد والياسمين)",
        "sku": "",
        "quantity": 0,
        "price_override": null
      },
      {
        "id": "c7496ed5-7fff-4e54-96e6-61a3829f6eaf",
        "option_name": "الرائحه",
        "option_value": "rehana(عطر رجالي ممتاز يستخدم اثناء العمل والليل)",
        "sku": "",
        "quantity": 0,
        "price_override": null
      }
    ]
  },
  {
    "id": "5352f549-2d68-4537-9e81-bb3725973085",
    "name_ar": "صابون لبان الذكر والعسل مستطيل (90 جرام )",
    "description_ar": "<p><strong>صابون لبان الذكر والعسل لمحاربه الشيخوخه وشد البشره&nbsp;</strong></p>\n<p><strong>طريقه الاستخدام</strong></p>\n<p><strong>يغسل الوجه بالمياه الدافيه وثم يغسل بالصابون ويترك من دقيقتين لتلاته علي البشره</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7uidwdd0vc601nl0dzr7710__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__4_.png",
    "stock": 0,
    "is_active": false,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "3c9a5cc9-98b9-4705-bb91-682a366d6fa7",
    "name_ar": "زيت جوز هند وزن تمن لتر",
    "description_ar": "<p><strong>زيت الجوز هند يساعد في ترطيب الشعر والبشره ويساعد في خسارة الوزن</strong></p>",
    "price": 90.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cmfv1fo1u0jh801hn8asvbowc_cm5s2vtps02cg01n36pzq3u9c_IMG_5446.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "العنايه بالبشره"
    ],
    "variants": []
  },
  {
    "id": "c8b10ce7-6553-45a4-9fd7-8af26cce3c3e",
    "name_ar": "صابون المناطق الحساسه",
    "description_ar": "<p><strong>يساعد في تفتيح المناطق الحساسه واعطاؤه رائحه مميزه</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7ujosz80vdh01nleqdca7xh__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__16_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "09d16bf1-73c6-4269-a01c-4772fe671dcc",
    "name_ar": "برفان مميز من مطروح اوليفي ٥٠ مل",
    "description_ar": "",
    "price": 250.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cmfwwii8u0niv01hng2jgbeji__D9_A2_D9_A0_D9_A2_D9_A5_D9_A0_D9_A9_D9_A0_D9_A6__D9_A2_D9_A0_D9_A0_D9_A6_D9_A2_D9_A1.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره"
    ],
    "variants": [
      {
        "id": "836329ca-1c16-4237-b17e-bb7cb7755f60",
        "option_name": "الرائحه",
        "option_value": "rehana(عطر رجالي ممتاز يستخدم اثناء العمل والليل)",
        "sku": "",
        "quantity": 100,
        "price_override": null
      },
      {
        "id": "4adb1906-1416-42dc-a417-ec568d426ab1",
        "option_name": "الرائحه",
        "option_value": "arrej(مزيج من روايح الورد والياسمين)",
        "sku": "",
        "quantity": 100,
        "price_override": null
      },
      {
        "id": "e3086136-6cc1-4c1f-802b-f3b0b8edf572",
        "option_name": "الرائحه",
        "option_value": "jana(عطر رجالي قوي برائحه العود)",
        "sku": "",
        "quantity": 100,
        "price_override": null
      },
      {
        "id": "7d575815-f363-4f3d-893c-ac7a7b475249",
        "option_name": "الرائحه",
        "option_value": "loly(عطر عصري نسائي يترك بصمه هادئه مناسب للنهار)",
        "sku": "",
        "quantity": 100,
        "price_override": null
      },
      {
        "id": "ff5f5c32-bd0c-448f-9987-154809d36c56",
        "option_name": "الرائحه",
        "option_value": "naseem(عطر ناعم وخفيف للجنسين)",
        "sku": "",
        "quantity": 100,
        "price_override": null
      }
    ]
  },
  {
    "id": "14ac8623-6c7d-484e-ae12-dbe98cbfb321",
    "name_ar": "تركيبه زيت زيتون مع قرنفل",
    "description_ar": "<p><strong>تركيبة زيت الزيتون والقرنفل للمساعده علي زيادة نعومة الشعر وزيادة كثافه الشعر&nbsp;</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5s2uz4y02cf01n3hlak3wob_IMG_5447.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر"
    ],
    "variants": []
  },
  {
    "id": "9905b3dc-55c2-4859-9331-1cac1b02c55d",
    "name_ar": "زيت الخردل 60 مل",
    "description_ar": "",
    "price": 90.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5qvfbe701s901n36m2ugfa3_IMG_5424.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر"
    ],
    "variants": []
  },
  {
    "id": "b16ae66f-e0f8-4392-b056-841c6eb280c1",
    "name_ar": "زيت الخروع 60 مل",
    "description_ar": "",
    "price": 100.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5quvy7w01s301n3bvyw2y7v_IMG_5425.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "4f1bd68b-53b1-4f6c-9b35-69c0df454ffb",
    "name_ar": "زيت الجرجير 60 مل",
    "description_ar": "<p><strong>&nbsp;</strong></p>\n<p><strong>يحافظ على البشرة ويمنحها الانتعاش والترطيب اللازم ويحميها من أشعة الشمس المباشرة. فوائد زيت الجرجير للشعر: يقوي بصيلات الشعر وينشط الدورة الدموية بالفروة. يطيل الشعر ويقويه ويمنع تساقطه ويحميه من التلف.</strong></p>",
    "price": 60.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5qv7olt01s501n3ee6u2zhb_IMG_5419.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "زيت الزيتون"
    ],
    "variants": []
  },
  {
    "id": "0906beee-c978-4612-8689-6d7971040f3e",
    "name_ar": "زيت جوز هند وزن ربع لتر",
    "description_ar": "<p><strong>زيت الجوز هند يساعد في ترطيب الشعر والبشره ويساعد في خسارة الوزن</strong></p>",
    "price": 180.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5s2vtps02cg01n36pzq3u9c_IMG_5446.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "العنايه بالشعر",
      "العنايه بالبشره"
    ],
    "variants": []
  },
  {
    "id": "bd612b91-2fe4-4b04-8d39-caf4ecee0d88",
    "name_ar": "زيت السُعد",
    "description_ar": "<p><strong>يساعد في ازاله الشعر الغير مرغوب فيه</strong></p>\n<p><strong>وزن 60 جرام</strong></p>",
    "price": 120.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm5qvdnlf01s801n306b4flg1_IMG_5423.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الزيوت الطبيعيه",
      "الا كثر مبيعا",
      "العنايه بالبشره"
    ],
    "variants": []
  },
  {
    "id": "f1ada309-9db4-47a4-895b-70e167574990",
    "name_ar": "سكراب ببذور الزيتون",
    "description_ar": "<p style=\"text-align: center;\"><strong>يساعدك الاسكراب في التخلص من الاتربه وبقايا المكياج المتراكمه في المسام وعلي الوجه&nbsp;</strong></p>\n<p style=\"text-align: center;\"><strong>&nbsp;كما يساعدك في تقشير الجلد الميت </strong></p>\n<p style=\"text-align: center;\"><strong>واعطاء البشره نضاره وحيويه</strong></p>",
    "price": 80.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cmeytme5w4uum01ks1cizg5ig__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__1_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "f30d1196-4907-424b-a510-f87fee919d00",
    "name_ar": "صابون مغربي بالروزماري",
    "description_ar": "<p><strong>جم 450</strong></p>\n<p><strong>طريقه الاستخدام</strong></p>\n<p><strong>يبل الجسم بالماء الدافي ثم توضع كميه كافيه ويدلك الجسم جيدا لمده 5 دقايق يستخدم مرتين في الاسبوع</strong></p>\n<p><strong>يستخدم للبشره يحتوي ع مضادات اكسده ومضادات التهاب ويساعد في تنظيف المسام ويزيل الجلد الميت وحب الشباب</strong><strong>&nbsp;</strong><strong>&nbsp;</strong></p>",
    "price": 170.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7ujmqr80vdf01nlfrcr4a5y__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__11_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "59b64d24-0edb-4dec-9879-6a8807d71ecc",
    "name_ar": "صابون مغربي بالقرنفل",
    "description_ar": "<p><strong>450جم</strong></p>\n<p><strong>طريقه الاستخدام</strong></p>\n<p><strong>يبل الجسم بالماء الدافي ثم توضع كميه كافيه ويدلك الجسم جيدا لمده 5 دقايق يستخدم مرتين في الاسبوع</strong></p>\n<p><strong>يستخدم للبشره يحتوي ع مضادات اكسده ومضادات التهاب ويساعد في تنظيف المسام ويزيل الجلد الميت وحب الشباب</strong></p>\n<p>&nbsp;</p>",
    "price": 170.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7ujkrxx0vd701nlbkby7fa5__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__12_.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "54b1376e-5ad4-417b-a442-63f11edfeec4",
    "name_ar": "مخمريات",
    "description_ar": "<p><strong>مجموعه متنوعه من المخمريات والتي تدوم لفتره طويله</strong></p>",
    "price": 100.0,
    "old_price": 120.0,
    "main_image": "https://assets.wuiltstore.com/cmel04q5y41zg01ks936g3qon_IMG_1715.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "العنايه بالبشره",
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": [
      {
        "id": "a2611938-500f-4688-8809-427e232a83ce",
        "option_name": "الرائحه",
        "option_value": "loly(عطر عصري نسائي يترك بصمه هادئه مناسب للنهار)",
        "sku": "",
        "quantity": 100,
        "price_override": 100.0
      },
      {
        "id": "6cbd34c8-8c23-4004-adfe-18d0e09da743",
        "option_name": "الرائحه",
        "option_value": "naseem(عطر ناعم وخفيف للجنسين)",
        "sku": "",
        "quantity": 100,
        "price_override": 100.0
      },
      {
        "id": "b760c46a-f062-4f1e-a098-c69457090b3c",
        "option_name": "الرائحه",
        "option_value": "rehana(عطر رجالي ممتاز يستخدم اثناء العمل والليل)",
        "sku": "",
        "quantity": 100,
        "price_override": 100.0
      },
      {
        "id": "7bfb5a49-9d0f-491c-a5d6-219692e99b37",
        "option_name": "الرائحه",
        "option_value": "arrej(مزيج من روايح الورد والياسمين)",
        "sku": "",
        "quantity": 100,
        "price_override": 100.0
      },
      {
        "id": "73a6abc1-f64d-43d5-a583-1578ecbf40b5",
        "option_name": "الرائحه",
        "option_value": "jana(عطر رجالي قوي برائحه العود)",
        "sku": "",
        "quantity": 100,
        "price_override": 100.0
      }
    ]
  },
  {
    "id": "84f42707-89ce-45fe-9024-f59e8374a0e1",
    "name_ar": "صابون النيله الزرقا  90 جرام (مستطيل)",
    "description_ar": "<p><strong>يساعد في التخلص من الجلد الميت وتنظيف المسام من بقايا الشوائب والمكياج</strong></p>\n<p><strong>طريقه الاستخدام</strong></p>\n<p><strong>يغسل الوجه بالمياه الدافيه وثم يغسل بالصابون ويترك من دقيقتين لتلاته علي البشره</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7uhusj90vbn01nlfj8nhgi5__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__1_.png",
    "stock": 0,
    "is_active": false,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "6fa0edd6-616a-4f57-b10f-7520e068ca81",
    "name_ar": "صابون جوز هند طبيعي  90 جرام (مستطيل)",
    "description_ar": "<p><strong>يساعد في ترطيب وتبيض البشره واعطائها نضاره</strong></p>\n<p><strong>طريقه استخدامها </strong></p>\n<p><strong>يغسل الوجه بمياه دافيه ويغسل الوجه بصابون لمده ٣ دقايق</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7uii26b0vcc01nlfwu3gd23__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__5_.png",
    "stock": 0,
    "is_active": false,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "1dfd819b-04dd-4c3a-870c-d7999dbf12fd",
    "name_ar": "صابون زبده الشيا  90 جرام (مستطيل)",
    "description_ar": "<p><strong>يستخدم للبشره الجافه ويعطيها ترطيب ويزيل اثار الحبوب نتيجه التقدم في السن ويزيل الترهلات اسفل العين</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7uimu0l0vch01nl7msk8jxc__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__6_.png",
    "stock": 0,
    "is_active": false,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "46bc6a9f-02f1-4997-b524-0921e52f6bba",
    "name_ar": "صابون فحم طبيعي  90 جرام (مستطيل)",
    "description_ar": "<p><strong>صابون فحم طبيعي يستخدم للبشره الدهنيه ويزيل حبوب الشباب ويساعد في ازاله الرؤوس السوداء&nbsp;</strong></p>\n<p><strong>طريقه استخدامها يتم غسل الوجه بمياء سخنه وغسل الوجه بالصابون وتركه علي الوجه لمده ٣ دقايق</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7uhszi50vbj01nlbjwc5te9__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__3_.png",
    "stock": 0,
    "is_active": false,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "ec328614-8fde-415e-af6e-e845a46fb64a",
    "name_ar": "صابون كركم وعسل 90 جرام (مستطيل)",
    "description_ar": "<p><strong>يساعد في علاج النمش والكلف والصدفيه والاكزيما والتصبغات وحروق الشمس وترميم الجلد</strong></p>\n<p><strong>طريقه الاستخدام </strong></p>\n<p><strong>يغسل الوجه بالمياه الدافيه وثم يغسل بالصابون ويترك من دقيقتين لتلاته علي البشره</strong></p>",
    "price": 50.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm7uhuczy0vbm01nl4p878ust__D8_AA_D8_B5_D9_85_D9_8A_D9_85__D8_A8_D8_AF_D9_88_D9_86__D8_B9_D9_86_D9_88_D8_A7_D9_86__2_.png",
    "stock": 0,
    "is_active": false,
    "collections": [
      "منتجات عنايه بالبشره والشعر"
    ],
    "variants": []
  },
  {
    "id": "820c3ee0-1c08-4b7d-871d-f95ca5866ddf",
    "name_ar": "خل تفاح عضوي",
    "description_ar": "<p><strong>خل تفاح عضوي طبيعي وزن نص لتر&nbsp;</strong></p>",
    "price": 125.0,
    "old_price": null,
    "main_image": "https://assets.wuiltstore.com/cm6rryz5u050h01nl6mmp2b8h__D9_A2_D9_A0_D9_A2_D9_A5_D9_A0_D9_A2_D9_A0_D9_A5__D9_A0_D9_A3_D9_A4_D9_A7_D9_A2_D9_A6.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "الا كثر مبيعا",
      "منتجات اخري",
      "خل التفاح"
    ],
    "variants": []
  },
  {
    "id": "11d9ac1d-dd03-4e6d-889b-683db806c8c9",
    "name_ar": "دبس رمان طبيعي ٤٥٠ مل",
    "description_ar": "<p><strong>دبس رمان طبيعي ٤٥٠ مل يستخدم للمشويات والسلطات</strong></p>",
    "price": 120.0,
    "old_price": 150.0,
    "main_image": "https://assets.wuiltstore.com/cm5xlya5a056x01n3fsx8fuaf_IMG_5519.png",
    "stock": 100,
    "is_active": true,
    "collections": [
      "منتجات اخري"
    ],
    "variants": []
  }
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🗑️  Clearing old data...');
    await client.query('DELETE FROM product_categories');
    await client.query('DELETE FROM product_variants');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    console.log('📂 Inserting categories...');
    const catKeys = Object.keys(CATEGORIES);
    for (let i = 0; i < catKeys.length; i++) {
      const name = catKeys[i];
      const id = CATEGORIES[name];
      const slug = name.replace(/\s+/g, '-');
      await client.query(
        'INSERT INTO categories (id, name_en, name_ar, slug, is_active, sort_order) VALUES ($1,$2,$3,$4,1,$5)',
        [id, name, name, slug, i]
      );
    }

    console.log('📦 Inserting products...');
    for (const p of PRODUCTS) {
      await client.query(
        `INSERT INTO products (id, name_en, name_ar, description_ar, price, old_price, main_image, images, stock, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'[]',$8,$9)`,
        [p.id, p.name_ar, p.name_ar, p.description_ar, p.price, p.old_price, p.main_image, p.stock, p.is_active]
      );
      for (const col of p.collections) {
        const catId = CATEGORIES[col];
        if (catId) {
          await client.query(
            'INSERT INTO product_categories (product_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [p.id, catId]
          );
        }
      }
      for (const v of p.variants) {
        await client.query(
          'INSERT INTO product_variants (id, product_id, option_name, option_value, sku, quantity, price_override) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [v.id, p.id, v.option_name, v.option_value, v.sku, v.quantity, v.price_override]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Done! ${PRODUCTS.length} products, ${Object.keys(CATEGORIES).length} categories`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();


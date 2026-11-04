INSSAT TRAVEL SERVICE - نسخة ربط العروض المشتركة

المحتويات:
- index.html: الموقع مع ربط قسم العروض بـ Google Apps Script.
- assets/logo-original.png: الشعار الأصلي.
- about-legacy.html: صفحة المعلومات القديمة المحفوظة.
- AppsScript_CODE.txt: الكود المطلوب وضعه في محرر Apps Script.

قبل رفع الموقع إلى GitHub Pages:
1) افتح جدول INSSAT TRAVEL OFFERS وأضف في H1: نوع العرض.
2) افتح Extensions > Apps Script، واستبدل الكود كاملاً بمحتوى AppsScript_CODE.txt.
3) احتفظ بـ ADMIN_PASSWORD داخل Project Settings > Script Properties، ولا تضعه في الموقع.
4) احفظ، ثم Deploy > Manage deployments > Edit (رمز القلم) > Version: New version > Deploy.
5) استخدم رابط Web app نفسه المنتهي بـ /exec؛ الرابط موجود مسبقاً في index.html.
6) ارفع محتويات هذا المجلد إلى مستودع GitHub Pages مع الحفاظ على مجلد assets.

مهم:
- صفحة الموقع لا تحتوي على كلمة مرور الإدارة. التحقق يتم في Apps Script.
- صور العروض تُضاف كرابط صورة مباشر يبدأ بـ https://، وليس برفع ملف من الجهاز.
- لا تضع بيانات زبائن أو معلومات سرية في جدول العروض.
- endpoint القراءة متاح للزوار ليتمكن الموقع من عرض العروض المنشورة. عمليات الإدارة تتطلب كلمة المرور المخزنة في Script Properties.

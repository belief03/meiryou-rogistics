<?php
/**
 * お問い合わせフォーム送信処理
 * - 会社宛て通知メール
 * - お客様への自動返信
 * - 成功時は完了ページへリダイレクト
 */

declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact-good.html', true, 303);
    exit;
}

$config = require __DIR__ . '/contact-config.php';

// ハニーポット（ボット対策）：埋まっていたら成功扱いで完了ページへ
if (!empty($_POST['website'])) {
    header('Location: ' . $config['thanks_url'], true, 303);
    exit;
}

function contact_str(string $key): string
{
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) {
        return '';
    }
    return trim(str_replace(["\r", "\n"], '', $v));
}

function contact_text(string $key): string
{
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) {
        return '';
    }
    return trim(str_replace("\0", '', $v));
}

$name = contact_str('name');
$company = contact_str('company');
$email = contact_str('email');
$tel = contact_str('tel');
$type = contact_str('type');
$message = contact_text('message');
$agree = isset($_POST['agree']) && (string) $_POST['agree'] === '1';

$typeLabels = [
    'delivery' => '搬入・据付',
    'inspection' => '出荷試験・出荷検査',
    'pack' => '梱包・輸送',
    'renewal' => '機械リニューアル・修理',
    'other' => 'その他',
];

$errors = [];

if ($name === '') {
    $errors[] = 'name';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email';
}
if ($type === '' || !isset($typeLabels[$type])) {
    $errors[] = 'type';
}
if ($message === '') {
    $errors[] = 'message';
}
if (!$agree) {
    $errors[] = 'agree';
}

if ($errors !== []) {
    header('Location: ' . $config['form_url'] . '?error=1', true, 303);
    exit;
}

$typeLabel = $typeLabels[$type];
$companyDisp = $company !== '' ? $company : '（未記入）';
$telDisp = $tel !== '' ? $tel : '（未記入）';
$now = date('Y-m-d H:i:s');

$hasMb = function_exists('mb_send_mail') && function_exists('mb_encode_mimeheader');
if ($hasMb) {
    mb_language('Japanese');
    mb_internal_encoding('UTF-8');
}

$fromNameEncoded = $hasMb
    ? mb_encode_mimeheader($config['from_name'], 'UTF-8')
    : '=?UTF-8?B?' . base64_encode($config['from_name']) . '?=';

$fromHeader = sprintf('From: %s <%s>', $fromNameEncoded, $config['from']);

$mailer = static function (string $to, string $subject, string $body, string $headers) use ($hasMb): bool {
    if ($hasMb) {
        return (bool) @mb_send_mail($to, $subject, $body, $headers);
    }
    $subjectEnc = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return (bool) @mail($to, $subjectEnc, $body, $headers);
};

$adminBody = <<<EOT
ホームページのお問い合わせフォームより連絡がありました。

受付日時: {$now}

【お名前】
{$name}

【会社名】
{$companyDisp}

【メールアドレス】
{$email}

【電話番号】
{$telDisp}

【お問い合わせ種別】
{$typeLabel}

【お問い合わせ内容】
{$message}

---
このメールは名菱運輸ホームページのフォームから自動送信されています。
EOT;

$autoBody = <<<EOT
{$name} 様

この度は株式会社名菱運輸へお問い合わせいただき、誠にありがとうございます。
以下の内容で受け付けいたしました。

内容確認のうえ、担当よりご連絡いたします。
今しばらくお待ちくださいますようお願い申し上げます。

--------------------
【お名前】{$name}
【会社名】{$companyDisp}
【メールアドレス】{$email}
【電話番号】{$telDisp}
【お問い合わせ種別】{$typeLabel}
【お問い合わせ内容】
{$message}
--------------------

※本メールは自動送信です。このメールへの返信は受け付けておりません。
※お急ぎの場合はお電話（052-711-0231）でもご相談を承ります。
　受付時間：平日 8:30〜17:30（土日祝休）

株式会社名菱運輸
EOT;

$adminHeaders = [
    $fromHeader,
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$autoHeaders = [
    $fromHeader,
    'Reply-To: ' . $config['from'],
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$sendAdmin = $mailer(
    $config['to'],
    $config['admin_subject'],
    $adminBody,
    implode("\r\n", $adminHeaders)
);

$mailer(
    $email,
    $config['auto_subject'],
    $autoBody,
    implode("\r\n", $autoHeaders)
);

if (!$sendAdmin) {
    header('Location: ' . $config['form_url'] . '?error=send', true, 303);
    exit;
}

// 自動返信失敗時も受付は完了扱い（会社側には届いている）
header('Location: ' . $config['thanks_url'], true, 303);
exit;

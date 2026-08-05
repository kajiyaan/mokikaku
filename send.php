<?php
declare(strict_types=1);

mb_internal_encoding('UTF-8');

const TO_ADDRESS = 'info@mokikaku.jp';
const FROM_ADDRESS = 'info@mokikaku.jp';
const FROM_NAME = '歩香ラボ | エムオー企画 サイト';

function post(string $key): string
{
    return isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
}

function clean_header_value(string $value): string
{
    return trim(str_replace(["\r", "\n"], '', $value));
}

function label(array $map, string $value): string
{
    if ($value === '') {
        return '(未選択)';
    }
    return $map[$value] ?? $value;
}

function render_result_page(bool $success, string $errorMessage = ''): void
{
    $title = $success ? '送信が完了しました' : '送信できませんでした';
    $icon = $success ? '✅' : '⚠️';
    $message = $success
        ? 'お問い合わせありがとうございます。<br>担当者よりご連絡いたします。'
        : htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') . '<br>お手数ですが、お電話にてご連絡いただくか、時間をおいて再度お試しください。';

    header('Content-Type: text/html; charset=UTF-8');
    echo <<<HTML
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>{$title} | 有限会社エムオー企画</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<section class="section">
  <div class="container" style="max-width:560px;text-align:center;">
    <div style="font-size:3rem;margin-bottom:1rem;">{$icon}</div>
    <h1 style="font-size:1.3rem;font-weight:800;margin-bottom:.75rem;color:var(--text);">{$title}</h1>
    <p style="color:var(--text-mid);line-height:1.8;margin-bottom:2rem;">{$message}</p>
    <a href="entry.html" class="btn btn--primary">エントリーページに戻る</a>
  </div>
</section>
</body>
</html>
HTML;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    render_result_page(false, '不正なリクエストです。');
    exit;
}

// Honeypot: bots tend to fill every field, real visitors never see this one.
if (post('website') !== '') {
    http_response_code(200);
    render_result_page(true);
    exit;
}

$formType = post('form_type');
if (!in_array($formType, ['worker', 'company', 'contact'], true)) {
    http_response_code(400);
    render_result_page(false, 'フォーム種別が不正です。');
    exit;
}

$email = post('email');
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    render_result_page(false, 'メールアドレスの形式が正しくありません。');
    exit;
}

$disabilityLabels = [
    'physical' => '身体障がい',
    'mental' => '精神障がい',
    'intellectual' => '知的障がい',
    'developmental' => '発達障がい',
    'other' => 'その他・未診断',
];

$sizeLabels = [
    '1-50' => '1〜50名',
    '51-100' => '51〜100名',
    '101-300' => '101〜300名',
    '301-1000' => '301〜1000名',
    '1001+' => '1001名以上',
];

$countLabels = [
    '1' => '1名',
    '2-3' => '2〜3名',
    '4-5' => '4〜5名',
    '6-10' => '6〜10名',
    '11+' => '11名以上',
];

$lines = [];

if ($formType === 'worker') {
    $name = post('name');
    $kana = post('kana');
    $privacy = post('privacy');
    if ($name === '' || $kana === '' || $privacy === '') {
        http_response_code(400);
        render_result_page(false, '必須項目が入力されていません。');
        exit;
    }

    $subjectSource = clean_header_value($name);
    $subject = "【歩香ラボ／エムオー企画】障がいをお持ちの方からのエントリー：{$subjectSource}";

    $lines[] = 'フォーム種別: 障がいをお持ちの方';
    $lines[] = 'お名前: ' . $name;
    $lines[] = 'ふりがな: ' . $kana;
    $lines[] = 'メールアドレス: ' . $email;
    $lines[] = '電話番号: ' . post('tel');
    $lines[] = '年齢: ' . post('age');
    $lines[] = '障がいの種類: ' . label($disabilityLabels, post('disability'));
    $lines[] = '';
    $lines[] = 'ご希望・ご相談内容:';
    $lines[] = post('message');
} else {
    $company = post('company');
    $name = post('name');
    $tel = post('tel');
    $privacy = post('privacy');
    if ($company === '' || $name === '' || $tel === '' || $privacy === '') {
        http_response_code(400);
        render_result_page(false, '必須項目が入力されていません。');
        exit;
    }

    $subjectSource = clean_header_value($company);
    $subject = "【歩香ラボ／エムオー企画】企業様からのエントリー：{$subjectSource}";

    $lines[] = 'フォーム種別: 企業様';
    $lines[] = '会社名: ' . $company;
    $lines[] = '部署名: ' . post('dept');
    $lines[] = '担当者名: ' . $name;
    $lines[] = 'メールアドレス: ' . $email;
    $lines[] = '電話番号: ' . $tel;
    $lines[] = '従業員規模: ' . label($sizeLabels, post('size'));
    $lines[] = '希望する雇用人数: ' . label($countLabels, post('count'));
    $lines[] = '';
    $lines[] = 'ご要望・ご相談内容:';
    $lines[] = post('message');
} else {
    // contact: company.html general inquiry form
    $name = post('name');
    $message = post('message');
    $privacy = post('privacy');
    if ($name === '' || $message === '' || $privacy === '') {
        http_response_code(400);
        render_result_page(false, '必須項目が入力されていません。');
        exit;
    }

    $subjectInput = post('subject');
    $subjectSource = clean_header_value($subjectInput !== '' ? $subjectInput : $name);
    $subject = "【歩香ラボ／エムオー企画】お問い合わせ：{$subjectSource}";

    $lines[] = 'フォーム種別: お問い合わせ（会社概要ページ）';
    $lines[] = 'お名前: ' . $name;
    $lines[] = 'メールアドレス: ' . $email;
    $lines[] = '件名: ' . ($subjectInput !== '' ? $subjectInput : '(未入力)');
    $lines[] = '';
    $lines[] = 'お問い合わせ内容:';
    $lines[] = $message;
}

$lines[] = '';
$lines[] = '---';
$lines[] = '送信日時: ' . date('Y-m-d H:i:s');
$lines[] = '送信元IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '不明');

$body = implode("\n", $lines);

$headers = [
    'From: ' . mb_encode_mimeheader(FROM_NAME) . ' <' . FROM_ADDRESS . '>',
    'Reply-To: ' . clean_header_value($email),
    'Content-Type: text/plain; charset=UTF-8',
];

$encodedSubject = mb_encode_mimeheader($subject, 'UTF-8');

$sent = mail(TO_ADDRESS, $encodedSubject, $body, implode("\r\n", $headers), '-f' . FROM_ADDRESS);

if (!$sent) {
    http_response_code(500);
    render_result_page(false, '送信に失敗しました。');
    exit;
}

render_result_page(true);

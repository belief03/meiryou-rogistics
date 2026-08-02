<?php
/**
 * お問い合わせフォーム設定
 * NTTPCサーバー上で、送信先・送信元メールを実際のアドレスに書き換えてください。
 */

return [
    // 受付メールの送信先（会社側）※後ほど差し替え
    'to' => 'CHANGE_ME@example.com',

    // 送信元（サーバーから送る From）。自社ドメインのメール推奨
    'from' => 'CHANGE_ME@example.com',

    // From 表示名
    'from_name' => '株式会社名菱運輸',

    // 会社側メールの件名
    'admin_subject' => '【名菱運輸】ホームページからのお問い合わせ',

    // 自動返信の件名
    'auto_subject' => '【名菱運輸】お問い合わせを受け付けました',

    // 完了ページ
    'thanks_url' => 'contact-thanks.html',

    // フォームページ（エラー時の戻り先）
    'form_url' => 'contact-good.html',
];

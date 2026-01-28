import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BankCode } from '@/lib/deeplink';

/**
 * GET /api/me/payment-accounts
 * 현재 사용자의 결제 계좌 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 결제 계좌 목록 조회
    const { data: accounts, error: fetchError } = await supabase
      .from('user_payment_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Payment accounts fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment accounts' },
        { status: 500 }
      );
    }

    // 스네이크 케이스 → 카멜 케이스 변환
    const formattedAccounts = accounts?.map((account: Record<string, unknown>) => ({
      id: account.id,
      userId: account.user_id,
      bankCode: account.bank_code as BankCode,
      bankName: account.bank_name,
      accountNumber: account.account_number,
      accountHolder: account.account_holder,
      supportsDeeplink: account.supports_deeplink,
      isPrimary: account.is_primary,
      isVerified: account.is_verified,
      nickname: account.nickname,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    })) || [];

    return NextResponse.json({
      success: true,
      accounts: formattedAccounts,
    });
  } catch (error) {
    console.error('Payment accounts API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/me/payment-accounts
 * 새 결제 계좌 등록
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      bankCode,
      bankName,
      accountNumber,
      accountHolder,
      nickname,
      isPrimary = false,
      supportsDeeplink = true,
    } = body;

    // 유효성 검사
    if (!bankCode || !bankName || !accountNumber) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 예금주가 없으면 사용자 프로필에서 이름 가져오기
    let holderName = accountHolder;
    if (!holderName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      holderName = profile?.display_name || user.email?.split('@')[0] || '사용자';
    }

    // 계좌번호 숫자만 추출
    const cleanAccountNumber = accountNumber.replace(/[^0-9]/g, '');

    if (cleanAccountNumber.length < 8 || cleanAccountNumber.length > 20) {
      return NextResponse.json(
        { success: false, error: '올바른 계좌번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 중복 계좌 확인
    const { data: existingAccount } = await supabase
      .from('user_payment_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('bank_code', bankCode)
      .eq('account_number', cleanAccountNumber)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 계좌입니다.' },
        { status: 409 }
      );
    }

    // 새 계좌 등록
    const { data: newAccount, error: insertError } = await supabase
      .from('user_payment_accounts')
      .insert({
        user_id: user.id,
        bank_code: bankCode,
        bank_name: bankName,
        account_number: cleanAccountNumber,
        account_holder: holderName,
        supports_deeplink: supportsDeeplink,
        is_primary: isPrimary,
        nickname,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Payment account insert error:', insertError);
      return NextResponse.json(
        { success: false, error: '계좌 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 스네이크 케이스 → 카멜 케이스 변환
    const formattedAccount = {
      id: newAccount.id,
      userId: newAccount.user_id,
      bankCode: newAccount.bank_code as BankCode,
      bankName: newAccount.bank_name,
      accountNumber: newAccount.account_number,
      accountHolder: newAccount.account_holder,
      supportsDeeplink: newAccount.supports_deeplink,
      isPrimary: newAccount.is_primary,
      isVerified: newAccount.is_verified,
      nickname: newAccount.nickname,
      createdAt: newAccount.created_at,
      updatedAt: newAccount.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: formattedAccount,
    });
  } catch (error) {
    console.error('Payment account create API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

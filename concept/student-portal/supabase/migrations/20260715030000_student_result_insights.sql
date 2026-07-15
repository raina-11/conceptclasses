-- Aggregate-only cohort context for student charts. This RPC deliberately
-- returns neither peer identifiers nor peer-level score rows.

create function api.student_result_insights(p_student_id uuid)
returns table (
  assessment_id uuid,
  qpt_number integer,
  display_title text,
  test_date date,
  subject_code text,
  subject_name text,
  max_marks numeric,
  student_score numeric,
  status text,
  rank bigint,
  cohort_highest_score numeric,
  cohort_average_score numeric,
  participant_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with cohort_results as (
    select
      a.id as assessment_id,
      a.qpt_number,
      a.display_title,
      a.test_date,
      su.code as subject_code,
      su.display_name as subject_name,
      c.max_marks,
      sc.student_id,
      sc.score,
      sc.status,
      case
        when sc.status <> 'present' then null
        when sc.source_rank is not null then sc.source_rank::bigint
        else rank() over (
          partition by c.id
          order by sc.score desc nulls last
        )
      end as result_rank,
      max(sc.score) filter (
        where sc.status = 'present' and sc.score is not null
      ) over (
        partition by c.id
      ) as highest_score,
      round(
        avg(sc.score) filter (
          where sc.status = 'present' and sc.score is not null
        ) over (
          partition by c.id
        ),
        2
      ) as average_score,
      count(*) filter (
        where sc.status = 'present' and sc.score is not null
      ) over (
        partition by c.id
      ) as present_count,
      c.sort_order
    from app_private.publications p
    join app_private.assessment_revisions r
      on r.id = p.revision_id
      and r.assessment_id = p.assessment_id
    join app_private.assessments a
      on a.id = p.assessment_id
    join app_private.assessment_components c
      on c.revision_id = r.id
    join app_private.subjects su
      on su.id = c.subject_id
    join app_private.student_scores sc
      on sc.revision_id = r.id
      and sc.component_id = c.id
    join app_private.enrollments e
      on e.student_id = sc.student_id
      and e.batch_id = a.batch_id
    where p.superseded_at is null
      and r.status = 'published'
  )
  select
    results.assessment_id,
    results.qpt_number,
    results.display_title,
    results.test_date,
    results.subject_code,
    results.subject_name,
    results.max_marks,
    results.score,
    results.status::text,
    results.result_rank,
    results.highest_score,
    results.average_score,
    results.present_count
  from cohort_results results
  where results.student_id = p_student_id
    and exists (
      select 1
      from app_private.student_account_links link
      where link.user_id = auth.uid()
        and link.student_id = p_student_id
        and link.is_active
        and app_private.is_account_active(auth.uid())
    )
  order by
    results.test_date desc,
    results.qpt_number desc,
    results.sort_order,
    results.subject_code;
$$;

revoke all on function api.student_result_insights(uuid)
  from public, anon, authenticated, service_role;
grant execute on function api.student_result_insights(uuid)
  to authenticated, service_role;

comment on function api.student_result_insights(uuid) is
  'Returns one linked student result plus identity-free cohort aggregates for current published assessment components.';

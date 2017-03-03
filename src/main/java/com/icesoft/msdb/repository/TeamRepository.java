package com.icesoft.msdb.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.icesoft.msdb.domain.Team;

/**
 * Spring Data JPA repository for the Team entity.
 */
public interface TeamRepository extends JpaRepository<Team,Long> {

    @Query("select distinct team from Team team left join fetch team.participations")
    List<Team> findAllWithEagerRelationships();

    @Query("select team from Team team left join fetch team.participations where team.id =:id")
    Team findOneWithEagerRelationships(@Param("id") Long id);

    @Query("select t from Team t where t.name like %?1% or t.hqLocation like %?1%")
    List<Team> search(String searchValue);
}

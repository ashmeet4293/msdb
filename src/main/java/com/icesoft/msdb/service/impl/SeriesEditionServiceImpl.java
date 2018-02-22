package com.icesoft.msdb.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.icesoft.msdb.MSDBException;
import com.icesoft.msdb.domain.Driver;
import com.icesoft.msdb.domain.EventEdition;
import com.icesoft.msdb.domain.EventEditionEntry;
import com.icesoft.msdb.domain.EventSession;
import com.icesoft.msdb.domain.PointsSystem;
import com.icesoft.msdb.domain.SeriesEdition;
import com.icesoft.msdb.domain.Team;
import com.icesoft.msdb.domain.stats.DriverStatistics;
import com.icesoft.msdb.domain.stats.Statistics;
import com.icesoft.msdb.domain.stats.TeamStatistics;
import com.icesoft.msdb.repository.DriverEventPointsRepository;
import com.icesoft.msdb.repository.DriverRepository;
import com.icesoft.msdb.repository.EventEditionRepository;
import com.icesoft.msdb.repository.EventEntryRepository;
import com.icesoft.msdb.repository.EventSessionRepository;
import com.icesoft.msdb.repository.PointsSystemRepository;
import com.icesoft.msdb.repository.SeriesEditionRepository;
import com.icesoft.msdb.repository.TeamEventPointsRepository;
import com.icesoft.msdb.repository.TeamRepository;
import com.icesoft.msdb.repository.impl.JDBCRepositoryImpl;
import com.icesoft.msdb.repository.stats.DriverStatisticsRepository;
import com.icesoft.msdb.repository.stats.TeamStatisticsRepository;
import com.icesoft.msdb.service.SeriesEditionService;
import com.icesoft.msdb.service.dto.EventEditionWinnersDTO;
import com.icesoft.msdb.service.dto.EventRacePointsDTO;
import com.icesoft.msdb.service.dto.SeriesEventsAndWinnersDTO;

@Service
@Transactional
public class SeriesEditionServiceImpl implements SeriesEditionService {
	
	private final EventEditionRepository eventRepo;
	private final SeriesEditionRepository seriesRepo;
	private final EventSessionRepository sessionRepo;
	private final PointsSystemRepository pointsRepo;
	private final DriverRepository driverRepo;
	private final DriverEventPointsRepository driverPointsRepo;
	private final TeamRepository teamRepo;
	private final TeamEventPointsRepository teamPointsRepo;
	private final DriverStatisticsRepository driverStatsRepo;
	private final TeamStatisticsRepository teamStatsRepo;
	private final JDBCRepositoryImpl jdbcRepo;
	private final EventEntryRepository eventEntryRepo;
	
	public SeriesEditionServiceImpl(EventEditionRepository eventRepo, SeriesEditionRepository seriesRepo, 
			EventSessionRepository sessionRepo, PointsSystemRepository pointsRepo, 
			DriverRepository driverRepo, DriverEventPointsRepository driverPointsRepo, TeamRepository teamRepo,
			TeamEventPointsRepository teamPointsRepo, DriverStatisticsRepository driverStatsRepo,
			TeamStatisticsRepository teamStatsRepo, JDBCRepositoryImpl jdbcRepo, EventEntryRepository eventEntryRepo) {
		this.eventRepo = eventRepo;
		this.seriesRepo = seriesRepo;
		this.sessionRepo = sessionRepo;
		this.pointsRepo = pointsRepo;
		this.driverRepo = driverRepo;
		this.driverPointsRepo = driverPointsRepo;
		this.teamRepo = teamRepo;
		this.teamPointsRepo = teamPointsRepo;
		this.driverStatsRepo = driverStatsRepo;
		this.teamStatsRepo = teamStatsRepo;
		this.jdbcRepo = jdbcRepo;
		this.eventEntryRepo = eventEntryRepo;
	}

	@Override
	public void addEventToSeries(Long seriesId, Long idEvent, List<EventRacePointsDTO> racesPointsData) {
		SeriesEdition seriesEd = seriesRepo.findOne(seriesId);
		if (seriesEd == null) {
			throw new MSDBException("No series edition found for id '" + seriesId + "'");
		}
		EventEdition eventEd = null;

		racesPointsData.parallelStream().forEach(racePoints -> {
			EventSession session = sessionRepo.findOne(racePoints.getRaceId());
			if (!racePoints.isAssigned()) {
				session.setPointsSystem(null);
				session.setPsMultiplier(0f);
			} else {
				PointsSystem points = pointsRepo.findOne(racePoints.getpSystemAssigned());
				if (session == null || points == null) {
					throw new MSDBException(
							String.format("Provided points for race data invalid [%s, %s]", 
									racePoints.getRaceId(), 
									racePoints.getpSystemAssigned()));
				}
				session.setPointsSystem(points);
				session.setPsMultiplier(racePoints.getPsMultiplier());
			}
			sessionRepo.save(session);
		});
		
		eventEd = eventRepo.findOne(idEvent);
		eventEd.setSeriesEdition(seriesEd);
		eventRepo.save(eventEd);
	}

	@Override
	public void removeEventFromSeries(Long seriesId, Long eventId) {
		EventEdition eventEd = eventRepo.findOne(eventId);
		if (eventId == null) {
			throw new MSDBException("No event edition found for id '" + eventId + "'");
		}
		if (!eventEd.getSeriesEdition().getId().equals(seriesId)) {
			throw new MSDBException("Provided series id does not match the already assigned one");
		}
		eventEd.setSeriesEdition(null);
		sessionRepo.findByEventEditionIdOrderBySessionStartTimeAsc(eventId).parallelStream()
			.forEach(session -> {
				session.setPointsSystem(null);
				sessionRepo.save(session);
			});
		eventRepo.save(eventEd);
		
		//We must remove the assigned points, if there are any
		sessionRepo.findByEventEditionIdOrderBySessionStartTimeAsc(eventId).stream()
			.forEach(session -> {
				driverPointsRepo.deleteSessionPoints(session.getId());
				teamPointsRepo.deleteSessionPoints(session.getId());
			});
	}

	@Transactional(readOnly=true)
	public List<EventEdition> findSeriesEvents(Long seriesId) {
		return eventRepo.findBySeriesEditionIdOrderByEventDateAsc(seriesId);
	}
	
	@Override
	public void setSeriesDriversChampions(Long seriesEditionId, List<Long> driverIds) {
		SeriesEdition seriesEd = seriesRepo.findOne(seriesEditionId);
		List<Driver> currentChamps = seriesEd.getDriversChampions();
		String categoryName = seriesEd.getSeries().getName();
		String year = seriesEd.getPeriodEnd();
		
		//Update statistics to remove championship won
		for(Driver d: currentChamps) {
			DriverStatistics ds = driverStatsRepo.findOne(d.getId().toString());
			Statistics st = ds.getStaticsForCategory(categoryName);
			st.removeChampionship(seriesEditionId);
			ds.updateStatistics(categoryName, st);
			st = ds.getStaticsForCategory(categoryName, year);
			st.removeChampionship(seriesEditionId);
			ds.updateStatistics(categoryName, st, year);
			driverStatsRepo.save(ds);
		}
		
		//Update statistics again for new champs
		seriesEd.setDriversChampions(driverRepo.findByIdIn(driverIds));
		for(Driver d: seriesEd.getDriversChampions()) {
			DriverStatistics ds = driverStatsRepo.findOne(d.getId().toString());
			Statistics st = ds.getStaticsForCategory(categoryName);
			st.addChampionship(seriesEd.getEditionName(), year, seriesEditionId);
			ds.updateStatistics(categoryName, st);
			st = ds.getStaticsForCategory(categoryName, year);
			st.addChampionship(seriesEd.getEditionName(), year, seriesEditionId);
			ds.updateStatistics(categoryName, st, year);
			driverStatsRepo.save(ds);
		}
		
		seriesRepo.save(seriesEd);
	}
	
	@Override
	@Transactional(readOnly = true)
	public List<Driver> getSeriesDriversChampions(Long seriesEditionId) {
		return seriesRepo.findOne(seriesEditionId).getDriversChampions();
	}
	
	@Override
	public void setSeriesTeamsChampions(Long seriesEditionId, List<Long> teamsIds) {
		SeriesEdition seriesEd = seriesRepo.findOne(seriesEditionId);
		List<Team> currentChamps = seriesEd.getTeamsChampions();
		String categoryName = seriesEd.getSeries().getName();
		String year = seriesEd.getPeriodEnd();
		
		//Update statistics to remove championship won
		for(Team d: currentChamps) {
			TeamStatistics ds = teamStatsRepo.findOne(d.getId().toString());
			Statistics st = ds.getStaticsForCategory(categoryName);
			st.removeChampionship(seriesEditionId);
			ds.updateStatistics(categoryName, st);
			st = ds.getStaticsForCategory(categoryName, year);
			st.removeChampionship(seriesEditionId);
			ds.updateStatistics(categoryName, st, year);
			teamStatsRepo.save(ds);
		}
		
		//Update statistics again for new champs
		seriesEd.setTeamsChampions(teamRepo.findByIdIn(teamsIds));
		for(Team d: seriesEd.getTeamsChampions()) {
			TeamStatistics ds = teamStatsRepo.findOne(d.getId().toString());
			Statistics st = ds.getStaticsForCategory(categoryName);
			st.addChampionship(seriesEd.getEditionName(), year, seriesEditionId);
			ds.updateStatistics(categoryName, st);
			st = ds.getStaticsForCategory(categoryName, year);
			st.addChampionship(seriesEd.getEditionName(), year, seriesEditionId);
			ds.updateStatistics(categoryName, st, year);
			teamStatsRepo.save(ds);
		}
		
		seriesRepo.save(seriesEd);
	}
	
	@Override
	@Transactional(readOnly = true)
	public List<Team> getSeriesTeamsChampions(Long seriesEditionId) {
		return seriesRepo.findOne(seriesEditionId).getTeamsChampions();
	}
	
	@Override
	@Transactional(readOnly = true)
	public List<SeriesEventsAndWinnersDTO> getSeriesEditionsEventsAndWinners(Long seriesEditionId) {
		List<EventEdition> events = findSeriesEvents(seriesEditionId);
		return events.parallelStream().map(e -> {
			List<EventEditionWinnersDTO> winners = new ArrayList<>();
	    	
	    	List<Object[]> tmpWinners = jdbcRepo.getEventWinners(e.getId());
	    	List<String> sessions = tmpWinners.stream().map(w -> (String)w[2]).distinct().collect(Collectors.toList());
	    	for(String session : sessions) {
	    		EventEditionWinnersDTO catWinners = new EventEditionWinnersDTO(session);
	    		EventEditionEntry overallWinner = null;
	    		for(Object[] winner : tmpWinners) {
	    			if (winner[2].equals(session)) {
		        		EventEditionEntry entry = eventEntryRepo.findOne((Long)winner[0]);
		        		catWinners.addWinners((String)winner[1], entry.getDriversName());
		        		if (winner[3].equals(new Integer(1))) {
		        			overallWinner = entry;
		        		}
	    			}
	        	}
	    		if (catWinners.getNumberOfCategories() > 1) {
	    			catWinners.addWinners("Overall", overallWinner.getDriversName());
	    		}
	    		catWinners.getWinners().sort((w1, w2) -> w1.compareTo(w2));
	    		winners.add(catWinners);
	    	}
	    	
	    	return new SeriesEventsAndWinnersDTO(e, winners);
		}).collect(Collectors.toList());
	}

}

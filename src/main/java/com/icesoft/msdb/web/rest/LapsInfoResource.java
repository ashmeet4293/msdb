package com.icesoft.msdb.web.rest;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.icesoft.msdb.domain.LapInfo;
import com.icesoft.msdb.service.dto.LapsInfoDriversDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.icesoft.msdb.domain.SessionLapData;
import com.icesoft.msdb.repository.EventEntryResultRepository;
import com.icesoft.msdb.repository.impl.SessionLapDataRepositoryImpl;

@RestController
@RequestMapping("/api/event-editions")
public class LapsInfoResource {

	@Autowired SessionLapDataRepositoryImpl repo;
	@Autowired EventEntryResultRepository resultsRepo;

	@GetMapping("/{sessionId}/laps")
	public ResponseEntity<Boolean> sessionLapDataLoaded(@PathVariable Long sessionId) {
		return ResponseEntity.ok(repo.sessionLapDataLoaded(sessionId));
	}

	@GetMapping("/{sessionId}/laps/{raceNumber}")
	public ResponseEntity<List<LapInfo>> getLapsDriver(@PathVariable Long sessionId, @PathVariable String raceNumber) {
		return ResponseEntity.ok(repo.getDriverLaps(sessionId.toString(), raceNumber).get(0).getLaps());
	}

	@GetMapping("/event-sessions/{sessionId}/laps/drivers")
	public ResponseEntity<List<LapsInfoDriversDTO>> getDriversWithData(@PathVariable Long sessionId) {
		List<LapsInfoDriversDTO> result;
		//TODO: Retrieve data from ES repository (do not show entries names that have no data
		result = resultsRepo.findSessionEntries(sessionId).stream()
				.map(LapsInfoDriversDTO::new).collect(Collectors.toList());
		return ResponseEntity.ok(result);
	}
}
